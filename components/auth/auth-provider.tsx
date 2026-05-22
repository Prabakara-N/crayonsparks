"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onIdTokenChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/use-auth";

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const lastEnsuredUidRef = useRef<string | null>(null);
  const { ensureUser } = useAuth();

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsub = onIdTokenChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        // Keep the server-side session cookie fresh (sign-in + hourly refresh).
        void nextUser
          .getIdToken()
          .then((idToken) =>
            fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            }),
          )
          .catch(() => {
            // Non-fatal — server routes also accept an Authorization header.
          });
        if (lastEnsuredUidRef.current !== nextUser.uid) {
          lastEnsuredUidRef.current = nextUser.uid;
          void ensureUser();
        }
      } else {
        lastEnsuredUidRef.current = null;
        void fetch("/api/auth/session", { method: "DELETE" }).catch(() => {
          // Non-fatal.
        });
      }
    });
    return () => unsub();
  }, [ensureUser]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

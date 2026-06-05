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
import { resetEnsureUser } from "@/lib/auth/ensure-user";
import { clearCachedMe, writeCachedUserProfile } from "@/lib/auth/cached-me";

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
        writeCachedUserProfile({
          uid: nextUser.uid,
          email: nextUser.email,
          displayName: nextUser.displayName,
          photoURL: nextUser.photoURL,
        });
        // Serialize: set the server session cookie FIRST, then call
        // ensureUser. Running them in parallel races — ensureUser fires
        // before the cookie exists, the oRPC protectedProcedure rejects
        // as unauthenticated, and the Firestore user doc never gets
        // created (no credits, no billing).
        void (async () => {
          try {
            const idToken = await nextUser.getIdToken();
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
          } catch {
            // Non-fatal — Authorization header is the fallback.
          }
          if (lastEnsuredUidRef.current !== nextUser.uid) {
            lastEnsuredUidRef.current = nextUser.uid;
            void ensureUser();
          }
        })();
      } else {
        lastEnsuredUidRef.current = null;
        resetEnsureUser();
        clearCachedMe();
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

interface FirebaseAuthError {
  code?: string;
  message?: string;
}

const FRIENDLY_BY_CODE: Record<string, string> = {
  "auth/email-already-in-use":
    "An account with this email already exists. Try signing in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-email": "Please enter your email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/weak-password":
    "Password must be at least 6 characters. Try something longer.",
  "auth/wrong-password": "Wrong password. Please try again.",
  "auth/invalid-credential":
    "We couldn't sign you in with those details. If you're new here, sign up first.",
  "auth/invalid-login-credentials":
    "We couldn't sign you in with those details. If you're new here, sign up first.",
  "auth/user-not-found":
    "We couldn't find an account with that email. Sign up first.",
  "auth/user-disabled":
    "This account has been disabled. Contact support if this is a mistake.",
  "auth/too-many-requests":
    "Too many attempts — please wait a moment and try again.",
  "auth/network-request-failed":
    "Connection issue — please check your internet and try again.",
  "auth/popup-blocked":
    "Your browser blocked the Google sign-in popup. Allow popups for this site and try again.",
  "auth/popup-closed-by-user":
    "Sign-in cancelled. Try again whenever you're ready.",
  "auth/cancelled-popup-request": "Sign-in cancelled.",
  "auth/account-exists-with-different-credential":
    "An account with this email already exists under a different sign-in method. Try the other method.",
  "auth/operation-not-allowed":
    "This sign-in method isn't enabled. Contact support.",
  "auth/requires-recent-login":
    "For security, please sign in again to continue.",
  "auth/unauthorized-domain":
    "This domain isn't authorized for sign-in. Contact support.",
};

const SIGN_UP_HINT_CODES = new Set<string>([
  "auth/invalid-credential",
  "auth/invalid-login-credentials",
  "auth/user-not-found",
]);

export interface FriendlyAuthError {
  message: string;
  suggestSignUp: boolean;
}

function getCode(error: unknown): string | null {
  if (error && typeof error === "object") {
    const err = error as FirebaseAuthError;
    if (err.code) return err.code;
    if (err.message) {
      const codeMatch = err.message.match(/\(auth\/([a-z-]+)\)/);
      if (codeMatch) return `auth/${codeMatch[1]}`;
    }
  }
  return null;
}

export function getFriendlyAuthError(
  error: unknown,
  fallback?: string,
): FriendlyAuthError {
  const code = getCode(error);
  if (code && FRIENDLY_BY_CODE[code]) {
    return {
      message: FRIENDLY_BY_CODE[code],
      suggestSignUp: SIGN_UP_HINT_CODES.has(code),
    };
  }
  return {
    message: fallback ?? "Something went wrong. Please try again.",
    suggestSignUp: false,
  };
}

export function friendlyAuthError(error: unknown, fallback?: string): string {
  return getFriendlyAuthError(error, fallback).message;
}

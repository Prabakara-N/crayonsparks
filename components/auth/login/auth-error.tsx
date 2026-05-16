import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

interface AuthErrorProps {
  message: string;
  suggestSignUp?: boolean;
  signUpHref?: string;
}

export function AuthError({
  message,
  suggestSignUp = false,
  signUpHref = "/signup",
}: AuthErrorProps) {
  if (!message) return null;
  return (
    <div className="space-y-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
      {suggestSignUp && (
        <Link
          href={signUpHref}
          className="ml-6 inline-flex items-center gap-1 text-[12px] font-semibold underline-offset-2 hover:underline"
        >
          Don&apos;t have an account? Sign up
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

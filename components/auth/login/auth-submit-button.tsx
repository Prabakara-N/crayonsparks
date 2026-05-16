"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface AuthSubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  busy?: boolean;
  children: ReactNode;
}

export function AuthSubmitButton({
  busy = false,
  disabled,
  children,
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-b from-blue-500 to-blue-600 text-sm font-medium text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition duration-150 hover:brightness-105 active:scale-98 disabled:cursor-not-allowed disabled:opacity-70"
      {...props}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

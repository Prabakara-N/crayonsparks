"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(
  function AuthTextField({ label, id, className, ...props }, ref) {
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`mt-2 h-11 w-full rounded-lg border border-transparent bg-white px-3 text-sm text-neutral-800 shadow-sm ring-1 shadow-black/10 ring-black/10 transition outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-100 dark:shadow-none dark:ring-white/10 ${className ?? ""}`}
          {...props}
        />
      </div>
    );
  },
);

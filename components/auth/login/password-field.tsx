"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, id, className, disabled, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
        <div className="relative mt-2">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            disabled={disabled}
            className={`h-11 w-full rounded-lg border border-transparent bg-white pr-11 pl-3 text-sm text-neutral-800 shadow-sm ring-1 shadow-black/10 ring-black/10 transition outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-100 dark:shadow-none dark:ring-white/10 ${className ?? ""}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            tabIndex={-1}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  },
);

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCheckout } from "@/lib/hooks/use-checkout";

type CheckoutContextValue = ReturnType<typeof useCheckout>;

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

/**
 * Holds ONE shared checkout state for a page. Every pricing/top-up button
 * reads the same `busyKey`, so starting one checkout disables all the
 * others until the redirect happens.
 */
export function CheckoutProvider({
  returnTo,
  children,
}: {
  returnTo?: string;
  children: ReactNode;
}) {
  const checkout = useCheckout(returnTo);
  return (
    <CheckoutContext.Provider value={checkout}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckoutContext(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    throw new Error("useCheckoutContext must be used within CheckoutProvider");
  }
  return ctx;
}

import React from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  children?: React.ReactNode;
  className?: string;
}

export function FeatureCard({ children, className }: FeatureCardProps) {
  return (
    <div className={cn("relative overflow-hidden p-4 sm:p-8", className)}>
      {children}
    </div>
  );
}

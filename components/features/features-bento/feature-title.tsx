import React from "react";

interface FeatureTitleProps {
  children?: React.ReactNode;
}

export function FeatureTitle({ children }: FeatureTitleProps) {
  return (
    <p className="mx-auto max-w-5xl text-left text-xl tracking-tight text-white md:text-2xl md:leading-snug">
      {children}
    </p>
  );
}

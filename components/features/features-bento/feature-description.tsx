import React from "react";

interface FeatureDescriptionProps {
  children?: React.ReactNode;
}

export function FeatureDescription({ children }: FeatureDescriptionProps) {
  return (
    <p className="mx-0 my-2 max-w-sm text-left text-sm md:text-sm font-normal text-neutral-300">
      {children}
    </p>
  );
}

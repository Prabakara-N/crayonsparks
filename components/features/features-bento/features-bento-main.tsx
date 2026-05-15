"use client";

import { FeatureCard } from "./feature-card";
import { FeatureTitle } from "./feature-title";
import { FeatureDescription } from "./feature-description";
import { SkeletonOne } from "./skeleton-one";
import { SkeletonTwo } from "./skeleton-two";
import { SkeletonThree } from "./skeleton-three";
import { SkeletonFour } from "./skeleton-four";

export function FeaturesBento() {
  const features = [
    {
      title: "Generate 20 consistent pages",
      description:
        "Master prompt formula keeps every page on-style. Gemini Nano Banana renders ~8s per page with 3× parallelism.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r border-white/10",
    },
    {
      title: "14 ready-to-publish themes",
      description:
        "Farm animals to unicorns — each pack ships with 20 prompts, KDP title, 7 keywords, and cover art direction.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 border-white/10",
    },
    {
      title: "CrayonSparks in action",
      description:
        "Every cover is real — generated end-to-end from theme pick to KDP-ready PDF in under five minutes.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r border-white/10",
    },
    {
      title: "Publish anywhere coloring books sell",
      description:
        "One source, four revenue streams. Auto-generate listings with consistent pricing and lead-magnet pages.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];

  return (
    <div className="relative z-20 mx-auto max-w-7xl py-10 lg:py-16">
      <div className="relative">
        <div className="grid grid-cols-1 rounded-md lg:grid-cols-6 xl:border border-white/10">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { SKELETON_TWO_ROWS } from "./features-bento-constants";

export function SkeletonTwo() {
  const imageVariants = {
    whileHover: { scale: 1.1, rotate: 0, zIndex: 100 },
    whileTap: { scale: 1.1, rotate: 0, zIndex: 100 },
  };

  return (
    <div className="relative flex h-full flex-col items-start gap-6 overflow-hidden p-8">
      {SKELETON_TWO_ROWS.map((row) => (
        <div key={row.key} className={cn("flex flex-row", row.offset)}>
          {row.covers.map((image, idx) => (
            <motion.div
              variants={imageVariants}
              key={`${row.key}-${idx}`}
              style={{ rotate: Math.random() * 20 - 10 }}
              whileHover="whileHover"
              whileTap="whileTap"
              className="mt-4 -mr-4 shrink-0 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800 p-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Coloring book cover"
                width="500"
                height="500"
                className="h-20 w-20 shrink-0 rounded-lg object-cover md:h-40 md:w-40"
              />
            </motion.div>
          ))}
        </div>
      ))}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-100 h-full w-20 bg-linear-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-100 h-full w-20 bg-linear-to-l from-black to-transparent" />
    </div>
  );
}

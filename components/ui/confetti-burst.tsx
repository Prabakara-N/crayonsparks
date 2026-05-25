"use client";

import confetti from "canvas-confetti";

const COLORS = [
  "#a78bfa",
  "#22d3ee",
  "#f472b6",
  "#facc15",
  "#34d399",
  "#fb923c",
  "#f43f5e",
  "#60a5fa",
];

export function fireConfettiBurst(originX: number, originY: number): void {
  if (typeof window === "undefined") return;
  const x = originX / window.innerWidth;
  const y = originY / window.innerHeight;
  confetti({
    particleCount: 120,
    spread: 90,
    startVelocity: 55,
    decay: 0.92,
    scalar: 1.1,
    ticks: 220,
    origin: { x, y },
    colors: COLORS,
    shapes: ["circle", "square"],
    zIndex: 10000,
  });
}

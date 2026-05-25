"use client";

const COLORS = [
  "#a78bfa",
  "#22d3ee",
  "#f472b6",
  "#facc15",
  "#34d399",
  "#fb923c",
];

export function fireConfettiBurst(originX: number, originY: number): void {
  if (typeof window === "undefined") return;
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "0";
  container.style.height = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "10000";
  document.body.appendChild(container);

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("span");
    const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.6;
    const distance = 90 + Math.random() * 110;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance + 80;
    const rot = (Math.random() - 0.5) * 720;
    const size = 6 + Math.random() * 6;
    const color = COLORS[i % COLORS.length];
    const isCircle = i % 2 === 0;
    particle.style.position = "fixed";
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = color;
    particle.style.borderRadius = isCircle ? "50%" : "2px";
    particle.style.transform = "translate(-50%, -50%)";
    particle.style.opacity = "1";
    particle.style.transition =
      "transform 1.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 1.4s ease-out";
    container.appendChild(particle);
    requestAnimationFrame(() => {
      particle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`;
      particle.style.opacity = "0";
    });
  }

  setTimeout(() => {
    container.remove();
  }, 2000);
}

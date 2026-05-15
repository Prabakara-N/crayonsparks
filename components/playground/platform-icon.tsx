"use client";

interface PlatformIconProps {
  src: string;
  className?: string;
}

// Renders a monochrome brand SVG from /public/logos via CSS mask so the
// glyph inherits the surrounding text color (Simple-Icons SVGs ship with
// no fill, which would render invisible black on the dark UI otherwise).
export function PlatformIcon({ src, className }: PlatformIconProps) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

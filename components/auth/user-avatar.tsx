"use client";

import { useState } from "react";
import type { User } from "firebase/auth";

interface UserAvatarProps {
  user: User;
  size?: number;
  className?: string;
}

function initialsFor(user: User): string {
  const source = (user.displayName || user.email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source[0].toUpperCase();
}

export function UserAvatar({
  user,
  size = 32,
  className = "",
}: UserAvatarProps) {
  const [imageBroken, setImageBroken] = useState(false);
  const initials = initialsFor(user);
  const showImage = !!user.photoURL && !imageBroken;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photoURL ?? ""}
        alt={user.displayName ?? user.email ?? "Account"}
        width={size}
        height={size}
        onError={() => setImageBroken(true)}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-cyan-400 text-white font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.floor(size * 0.42)),
      }}
      aria-label={user.displayName ?? user.email ?? "Account"}
    >
      {initials}
    </span>
  );
}

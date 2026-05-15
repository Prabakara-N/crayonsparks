"use client";

import { useEffect, useState } from "react";

export function useStateMounted(): [boolean, (v: boolean) => void] {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return [mounted, setMounted];
}

"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AuthNavSlot } from "@/components/auth/auth-nav-slot";
import { MobileNavDrawer } from "./mobile-nav-drawer";

const links = [
  { href: "/features", label: "Features" },
  { href: "/sparky-ai", label: "Sparky AI" },
  { href: "/playground", label: "Playground" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

const HIDDEN_ON = ["/login", "/signup"];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.some((p) => pathname?.startsWith(p))) return null;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-black/60 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.svg"
            alt="CrayonSparks"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform"
          />
          <span className="font-bold text-lg tracking-tight">CrayonSparks</span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white rounded-md hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <AuthNavSlot />
        </div>

        <button
          className="md:hidden p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </nav>

      <MobileNavDrawer
        open={open}
        onClose={() => setOpen(false)}
        links={links}
      />
    </header>
  );
}

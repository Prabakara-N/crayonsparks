import Link from "next/link";

export function AuthFooter() {
  return (
    <p className="mt-10 text-center text-xs text-neutral-400 dark:text-neutral-500">
      © CrayonSparks ·{" "}
      <Link
        href="/privacy"
        className="transition hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        Privacy
      </Link>{" "}
      ·{" "}
      <Link
        href="/terms"
        className="transition hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        Terms
      </Link>
    </p>
  );
}

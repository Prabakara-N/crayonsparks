export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-neutral-300 dark:bg-neutral-700" />
      <span className="text-xs text-neutral-500 dark:text-neutral-400">or</span>
      <div className="h-px flex-1 bg-neutral-300 dark:bg-neutral-700" />
    </div>
  );
}

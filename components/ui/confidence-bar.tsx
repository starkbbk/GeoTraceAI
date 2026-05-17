import { cn } from "@/lib/utils";

/**
 * Lightweight horizontal confidence bar with severity coloring.
 *
 * `value` is expected to be 0..1 (a fraction). Pass `percent` if you
 * already have a 0..100 number.
 */
export function ConfidenceBar({
  value,
  percent,
  label,
  className,
  tone = "info"
}: {
  value?: number;
  percent?: number;
  label?: string;
  className?: string;
  tone?: "good" | "warn" | "bad" | "info";
}) {
  const pct =
    percent !== undefined
      ? Math.max(0, Math.min(100, percent))
      : Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));

  const fill =
    tone === "good"
      ? "bg-emerald-400"
      : tone === "warn"
        ? "bg-amber-400"
        : tone === "bad"
          ? "bg-red-400"
          : "bg-accent-400";

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="font-medium text-slate-200">{pct}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

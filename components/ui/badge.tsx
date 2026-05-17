import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone === "neutral" && "border-white/10 bg-white/[0.06] text-slate-300",
        tone === "good" && "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
        tone === "warn" && "border-amber-300/20 bg-amber-400/10 text-amber-200",
        tone === "bad" && "border-red-300/20 bg-red-400/10 text-red-200",
        tone === "info" && "border-accent-300/20 bg-accent-400/10 text-accent-100",
        className
      )}
    >
      {children}
    </span>
  );
}

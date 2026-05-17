import { ConfidenceFactor } from "@/lib/osint/types";
import { formatPercent } from "@/lib/utils";

export function ConfidenceGraph({ factors }: { factors: ConfidenceFactor[] }) {
  return (
    <div className="space-y-3">
      {factors.map((factor) => (
        <div key={factor.label} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">{factor.label}</p>
              <p className="mt-1 text-xs text-slate-500">{factor.detail}</p>
            </div>
            <span className="text-sm text-slate-300">{formatPercent(factor.score)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-accent-300" style={{ width: formatPercent(factor.score) }} />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            {factor.provenance} | weight {Math.round(factor.weight * 100)}
          </p>
        </div>
      ))}
    </div>
  );
}

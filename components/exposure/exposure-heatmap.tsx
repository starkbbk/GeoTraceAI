import { ExposureIntelligence } from "@/lib/osint/types";

const color = {
  low: "bg-emerald-400/20 border-emerald-300/20",
  medium: "bg-amber-400/20 border-amber-300/20",
  high: "bg-red-400/20 border-red-300/20",
  critical: "bg-red-500/30 border-red-300/30"
};

export function ExposureHeatmap({ exposure }: { exposure: ExposureIntelligence }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {exposure.heatmap.map((cell) => (
        <div key={cell.label} className={`rounded-md border p-4 ${color[cell.severity]}`}>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{cell.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{cell.value}</p>
        </div>
      ))}
    </div>
  );
}

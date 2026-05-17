"use client";

import { motion } from "framer-motion";

type Distribution = {
  label: string;
  value: number;
};

const TONE_BY_LABEL: Record<string, string> = {
  "low-risk": "from-emerald-400/80 to-emerald-500/80",
  watch: "from-amber-400/80 to-amber-500/80",
  elevated: "from-orange-400/80 to-orange-500/80",
  "high-risk": "from-red-400/80 to-red-500/80",
  unknown: "from-slate-400/60 to-slate-500/60"
};

/**
 * Animated horizontal bar chart for risk distribution. Bars grow from 0
 * to their final width on mount with a staggered delay.
 */
export function RiskGraph({ data }: { data: Distribution[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((entry, index) => {
        const pct = Math.round((entry.value / max) * 100);
        const gradient = TONE_BY_LABEL[entry.label] ?? "from-slate-400/60 to-slate-500/60";
        return (
          <div key={entry.label}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="capitalize text-slate-300">{entry.label.replace("-", " ")}</span>
              <span className="font-medium text-white">{entry.value}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
              />
            </div>
          </div>
        );
      })}
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">No risk data yet. Run an investigation to populate.</p>
      ) : null}
    </div>
  );
}

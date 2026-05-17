"use client";

import { RelationshipGraph as Graph } from "@/lib/osint/types";
import { formatPercent } from "@/lib/utils";

const palette: Record<string, string> = {
  person: "bg-accent-400/20 border-accent-300/30 text-accent-50",
  company: "bg-cyan-400/15 border-cyan-300/30 text-cyan-50",
  location: "bg-emerald-400/15 border-emerald-300/30 text-emerald-50",
  email: "bg-violet-400/15 border-violet-300/30 text-violet-50",
  username: "bg-amber-400/15 border-amber-300/30 text-amber-50",
  phone: "bg-sky-400/15 border-sky-300/30 text-sky-50",
  website: "bg-pink-400/15 border-pink-300/30 text-pink-50",
  source: "bg-white/[0.06] border-white/10 text-slate-200"
};

export function RelationshipGraph({ graph }: { graph: Graph }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative min-h-[330px] overflow-hidden rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="absolute inset-0 soft-grid opacity-40" />
        <div className="relative flex h-full min-h-[300px] items-center justify-center">
          {graph.nodes.slice(0, 10).map((node, index) => {
            const angle = (index / Math.max(1, graph.nodes.slice(0, 10).length)) * Math.PI * 2;
            const isSubject = index === 0;
            const radius = isSubject ? 0 : 118;
            return (
              <div
                key={node.id}
                className={`absolute max-w-[130px] rounded-md border px-3 py-2 text-center text-xs shadow-glow ${palette[node.type]}`}
                style={{
                  transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`
                }}
              >
                <p className="truncate font-medium">{node.label}</p>
                <p className="mt-1 text-[10px] opacity-75">{formatPercent(node.confidence)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {graph.edges.slice(0, 12).map((edge, index) => {
          const from = graph.nodes.find((node) => node.id === edge.from);
          const to = graph.nodes.find((node) => node.id === edge.to);
          return (
            <div key={`${edge.from}-${edge.to}-${index}`} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm text-slate-200">
                  {from?.label ?? edge.from}
                  {" -> "}
                  {to?.label ?? edge.to}
                </p>
                <span className="text-xs text-slate-500">{formatPercent(edge.confidence)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{edge.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

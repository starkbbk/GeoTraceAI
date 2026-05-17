import { ExposureTimelineEvent } from "@/lib/osint/types";

const color = {
  low: "bg-emerald-300",
  medium: "bg-amber-300",
  high: "bg-red-300",
  critical: "bg-red-400"
};

export function ExposureTimeline({ events }: { events: ExposureTimelineEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="grid grid-cols-[92px_1fr] gap-4">
          <div className="text-xs text-slate-500">{event.date.slice(0, 10)}</div>
          <div className="relative border-l border-white/10 pl-4">
            <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${color[event.severity]}`} />
            <p className="text-sm font-medium text-white">{event.label}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{event.source}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{event.detail}</p>
          </div>
        </div>
      ))}
      {events.length === 0 ? <p className="text-sm text-slate-400">No exposure timeline events yet.</p> : null}
    </div>
  );
}

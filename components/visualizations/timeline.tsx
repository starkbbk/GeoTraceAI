import { CheckCircle2, CircleDashed, SkipForward } from "lucide-react";
import { SearchTimelineEvent } from "@/lib/osint/types";

export function SearchTimeline({ events }: { events: SearchTimelineEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => {
        const Icon = event.status === "complete" ? CheckCircle2 : event.status === "partial" ? CircleDashed : SkipForward;
        return (
          <div key={event.id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-200" />
            <div>
              <p className="text-sm font-medium text-white">{event.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">{event.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

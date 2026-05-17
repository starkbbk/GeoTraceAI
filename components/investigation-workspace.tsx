import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { InvestigationTask } from "@/lib/osint/types";

const statusIcon = {
  done: CheckCircle2,
  review: CircleAlert,
  blocked: CircleDashed
};

const statusClass = {
  done: "text-emerald-200",
  review: "text-amber-200",
  blocked: "text-slate-400"
};

export function InvestigationWorkspace({ tasks }: { tasks: InvestigationTask[] }) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const Icon = statusIcon[task.status];
        return (
          <div key={task.id} className="flex gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${statusClass[task.status]}`} />
            <div>
              <p className="text-sm font-medium text-white">{task.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{task.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

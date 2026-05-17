import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExposureRecord } from "@/lib/osint/types";
import { formatPercent } from "@/lib/utils";

const tone = {
  low: "good",
  medium: "warn",
  high: "bad",
  critical: "bad"
} as const;

export function ExposureCards({ records }: { records: ExposureRecord[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {records.map((record) => (
        <details key={record.id} className="group rounded-lg border border-white/10 bg-white/[0.04] p-4 open:border-accent-300/30">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone={tone[record.severity]}>{record.severity}</Badge>
                <Badge tone={record.verified ? "good" : "neutral"}>{record.verified ? "verified" : "inferred"}</Badge>
              </div>
              <p className="text-sm font-medium text-white">{record.breachName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{record.source}</p>
            </div>
            <div className="text-right">
              <ShieldAlert className="ml-auto h-5 w-5 text-accent-100" />
              <p className="mt-2 text-xs text-slate-400">{formatPercent(record.confidence)}</p>
            </div>
          </summary>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-sm leading-6 text-slate-300">{record.summary}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Meta label="Exposure type" value={record.exposureType} />
              <Meta label="Breach year" value={record.breachYear ? String(record.breachYear) : "Unknown"} />
              <Meta label="First seen" value={record.firstSeen ?? "Unknown"} />
              <Meta label="Last seen" value={record.lastSeen ?? "Unknown"} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.categories.map((category) => (
                <span key={category} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300">
                  {category}
                </span>
              ))}
              {record.identifierTypes.map((type) => (
                <span key={type} className="rounded-full bg-accent-400/10 px-2.5 py-1 text-xs text-accent-100">
                  {type}
                </span>
              ))}
            </div>
            {record.sourceUrl ? (
              <a href={record.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 block text-sm text-accent-200">
                Public source reference
              </a>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Public-source disclaimer: metadata only. No passwords, stolen credentials, private records, or hacked data are displayed.
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-200">{value}</p>
    </div>
  );
}

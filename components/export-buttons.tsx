"use client";

import { Download, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportPayload = Record<string, unknown>;

/**
 * Client-side export buttons. Generates downloadable JSON and CSV
 * snapshots from the in-memory profile so analysts can export a
 * record without server round-trips.
 */
export function ExportButtons({
  profile,
  filenameBase
}: {
  profile: ExportPayload;
  filenameBase: string;
}) {
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json"
    });
    triggerDownload(blob, `${filenameBase}.json`);
  };

  const downloadCsv = () => {
    const csv = flattenToCsv(profile);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, `${filenameBase}.csv`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={downloadJson}>
        <FileJson className="h-4 w-4" />
        Export JSON
      </Button>
      <Button variant="secondary" size="sm" onClick={downloadCsv}>
        <FileText className="h-4 w-4" />
        Export CSV
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => window.print()}
        title="Print to PDF via the browser print dialog"
      >
        <Download className="h-4 w-4" />
        Print / PDF
      </Button>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Best-effort CSV flattening: emits one row per top-level scalar field
 * and one row per first-level array entry summarised as JSON.
 */
function flattenToCsv(payload: ExportPayload): string {
  const rows: string[][] = [["field", "value"]];

  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      rows.push([key, String(value)]);
    } else if (Array.isArray(value)) {
      rows.push([key, JSON.stringify(value)]);
    } else if (typeof value === "object") {
      rows.push([key, JSON.stringify(value)]);
    }
  }

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
}

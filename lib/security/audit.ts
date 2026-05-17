import { stableId } from "@/lib/utils";

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const auditEvents: AuditEvent[] = [];

export function writeAuditEvent(event: Omit<AuditEvent, "id" | "createdAt">) {
  const record = {
    ...event,
    id: stableId("audit"),
    createdAt: new Date().toISOString()
  };
  auditEvents.unshift(record);
  auditEvents.splice(250);
  return record;
}

export function listAuditEvents() {
  return auditEvents;
}

import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export interface AuditEntry {
  actorId: string;
  action: string; // e.g. "user.set_role", "listing.approve"
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipHash?: string;
}

type AuditWriter = Pick<Prisma.TransactionClient, "auditLog">;

/** Writes one AuditLog row; call inside the same transaction as the change it records. */
export async function writeAuditLog(client: AuditWriter, entry: AuditEntry): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: (entry.before ?? undefined) as Prisma.InputJsonValue | undefined,
      after: (entry.after ?? undefined) as Prisma.InputJsonValue | undefined,
      ipHash: entry.ipHash,
    },
  });
}

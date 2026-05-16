import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin";

export interface AuditLogEntry {
  adminUid: string;
  adminEmail: string | null;
  action: string;
  targetUid?: string;
  payload?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  await db
    .collection("admin")
    .doc("logs")
    .collection("entries")
    .add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });
}

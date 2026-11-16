import type { PartnerSyncPayload } from "@shared/partner-sync";

export async function copyPartnerPayload(payload: PartnerSyncPayload): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
}

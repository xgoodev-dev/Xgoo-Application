import type { PartnerSyncPayload } from "@shared/partner-sync";
import {
  XGOO_EXTENSION_MESSAGE_TYPE,
  XGOO_EXTENSION_PING,
  XGOO_EXTENSION_PONG,
  XGOO_EXTENSION_STORED,
} from "@shared/partner-sync";

export function notifyExtension(payload: PartnerSyncPayload): void {
  window.postMessage(
    {
      type: XGOO_EXTENSION_MESSAGE_TYPE,
      payload,
    },
    window.location.origin,
  );
}

export async function copyPartnerPayload(payload: PartnerSyncPayload): Promise<void> {
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
}

export function pingExtension(timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (event.data?.type === XGOO_EXTENSION_PONG) {
        done = true;
        window.removeEventListener("message", onMessage);
        resolve(true);
      }
    };

    window.addEventListener("message", onMessage);
    window.postMessage({ type: XGOO_EXTENSION_PING }, window.location.origin);

    setTimeout(() => {
      if (!done) {
        window.removeEventListener("message", onMessage);
        resolve(false);
      }
    }, timeoutMs);
  });
}

export function waitForExtensionStored(
  shipmentId: string,
  timeoutMs = 2000,
): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data;
      if (
        data?.type === XGOO_EXTENSION_STORED &&
        data.shipmentId === shipmentId
      ) {
        done = true;
        window.removeEventListener("message", onMessage);
        resolve(data.ok === true);
      }
    };

    window.addEventListener("message", onMessage);

    setTimeout(() => {
      if (!done) {
        window.removeEventListener("message", onMessage);
        resolve(false);
      }
    }, timeoutMs);
  });
}

export function isExtensionDomMarkerPresent(): boolean {
  return document.documentElement.dataset.xgooExtension === "1";
}

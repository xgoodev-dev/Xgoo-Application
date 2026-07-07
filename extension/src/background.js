const STORAGE_KEY = typeof XGOO_STORAGE_KEY !== "undefined" ? XGOO_STORAGE_KEY : "xgoo_pending_payload";
const MAX_AGE =
  typeof XGOO_PAYLOAD_MAX_AGE_MS !== "undefined" ? XGOO_PAYLOAD_MAX_AGE_MS : 30 * 60 * 1000;

function normalizeCode(code) {
  return (code || "").trim().toUpperCase();
}

function hostMatchesPartner(hostname, partnerCode) {
  const code = normalizeCode(partnerCode);
  const host = (hostname || "").toLowerCase();
  if (code === "DEL" || code === "DELHIVERY" || host.includes("delhivery")) return true;
  if (code === "ICL" || host.includes("indiancourier")) return true;
  if (code === "ST" || code === "STC" || host.includes("stcourier")) return true;
  if (code === "FRANCH" || host.includes("franchcourier")) return true;
  if (code === "DTDC" || host.includes("dtdc")) return true;
  if (code === "BD" || host.includes("bluedart")) return true;
  return false;
}

async function getStoredPayload() {
  const result = await chrome.storage.session.get(STORAGE_KEY);
  return result[STORAGE_KEY] || null;
}

async function setStoredPayload(entry) {
  await chrome.storage.session.set({ [STORAGE_KEY]: entry });
}

async function clearStoredPayload() {
  await chrome.storage.session.remove(STORAGE_KEY);
}

function isPayloadFresh(entry) {
  if (!entry?.storedAt) return false;
  return Date.now() - entry.storedAt < MAX_AGE;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message?.type === "XGOO_STORE_PAYLOAD") {
        const payload = message.payload;
        if (!payload?.shipmentId) {
          sendResponse({ ok: false, error: "Invalid payload" });
          return;
        }
        await setStoredPayload({
          payload,
          storedAt: Date.now(),
          sourceTabId: sender.tab?.id ?? null,
        });
        sendResponse({ ok: true });
        return;
      }

      if (message?.type === "XGOO_GET_PAYLOAD") {
        const entry = await getStoredPayload();
        if (!entry || !isPayloadFresh(entry)) {
          sendResponse({ ok: false, payload: null });
          return;
        }

        const hostname = message.hostname || "";
        const partnerCode = entry.payload?.partnerCode || "";
        if (hostname && partnerCode && !hostMatchesPartner(hostname, partnerCode)) {
          sendResponse({
            ok: false,
            payload: null,
            mismatch: true,
            expectedPartner: partnerCode,
          });
          return;
        }

        sendResponse({ ok: true, payload: entry.payload, storedAt: entry.storedAt });
        return;
      }

      if (message?.type === "XGOO_CLEAR_PAYLOAD") {
        await clearStoredPayload();
        sendResponse({ ok: true });
        return;
      }

      if (message?.type === "XGOO_GET_STATUS") {
        const entry = await getStoredPayload();
        sendResponse({
          ok: true,
          hasPayload: !!(entry && isPayloadFresh(entry)),
          payload: entry?.payload ?? null,
          storedAt: entry?.storedAt ?? null,
        });
        return;
      }

      sendResponse({ ok: false, error: "Unknown message" });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true;
});

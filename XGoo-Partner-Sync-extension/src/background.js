const STORAGE_KEY = typeof XGOO_STORAGE_KEY !== "undefined" ? XGOO_STORAGE_KEY : "xgoo_pending_payload";
const MAX_AGE =
  typeof XGOO_PAYLOAD_MAX_AGE_MS !== "undefined" ? XGOO_PAYLOAD_MAX_AGE_MS : 30 * 60 * 1000;

function normalizeCode(code) {
  return (code || "").trim().toUpperCase();
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostsMatch(hostname, portalUrl) {
  const host = (hostname || "").toLowerCase();
  const expected = hostFromUrl(portalUrl);
  if (!host || !expected) return false;
  const stripWww = (value) => value.replace(/^www\./, "");
  const a = stripWww(host);
  const b = stripWww(expected);
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

function hostMatchesPartner(hostname, partnerCode, portalUrl) {
  const host = (hostname || "").toLowerCase();
  if (portalUrl && hostsMatch(host, portalUrl)) return true;

  const code = normalizeCode(partnerCode);
  if (!code || !host) return true;
  if (code === "DEL" || code === "DELHIVERY") return host.includes("delhivery");
  if (code === "WF" || code === "WFC" || code === "WORLDFIRST" || code === "WORLD FIRST") {
    return host.includes("worldfirst");
  }
  if (code === "UPS") return host.includes("ups");
  if (code === "FX" || code === "FEDEX") return host.includes("fedex");
  if (code === "ICL") return host.includes("indiancourier");
  if (code === "ST" || code === "STC") return host.includes("stcourier");
  if (code === "FRANCH") return host.includes("franchcourier");
  if (code === "DTDC") return host.includes("dtdc");
  if (code === "BD") return host.includes("bluedart");
  return true;
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

const PARTNER_SCRIPT_FILES = [
  "src/constants.js",
  "src/lib/dom-utils.js",
  "src/adapters/generic.js",
  "src/adapters/delhivery.js",
  "src/adapters/world-first.js",
  "src/adapters/index.js",
  "src/content-partner.js",
];

function looksLikeHttpUrl(url) {
  return /^https?:\/\//i.test(url || "");
}

async function injectPartnerScripts(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: PARTNER_SCRIPT_FILES,
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: PARTNER_SCRIPT_FILES,
    });
  }
}

async function fillAllFrames(tabId) {
  try {
    const injection = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: async () => {
        if (typeof window.__xgooFillNow === "function") {
          return await window.__xgooFillNow();
        }
        return { ok: false, filled: 0, error: "XGoo is not loaded in this frame" };
      },
    });
    const frames = (injection || []).map((item) => item.result).filter(Boolean);
    const filled = frames.reduce((sum, frame) => sum + (Number(frame.filled) || 0), 0);
    const adapter = frames.find((frame) => frame.adapter)?.adapter;
    if (filled > 0) return { ok: true, filled, adapter };
    const error = frames.find((frame) => frame.error)?.error || "No matching fields on this page.";
    return { ok: false, filled: 0, error };
  } catch (error) {
    return { ok: false, filled: 0, error: String(error) };
  }
}

async function resolveFillTab(tabId, tabUrl) {
  const entry = await getStoredPayload();
  const payload = entry?.payload;
  const requestedHost = hostFromUrl(tabUrl);
  if (
    requestedHost &&
    payload &&
    hostMatchesPartner(requestedHost, payload.partnerCode, payload.portalUrl)
  ) {
    return tabId;
  }

  const portalHost = hostFromUrl(payload?.portalUrl || "");
  const patterns = [];
  if (portalHost) patterns.push(`*://${portalHost}/*`);
  patterns.push("*://*.worldfirst.in/*", "*://xpresion.worldfirst.in/*", "*://xpression.worldfirst.in/*");

  try {
    const tabs = await chrome.tabs.query({ url: patterns });
    const match = tabs.find((tab) => /shipentry|awb|booking|ship/i.test(tab.url || "")) || tabs[0];
    if (match?.id) return match.id;
  } catch {
    /* query pattern may be unsupported */
  }
  return tabId;
}

async function fillTab(tabId, tabUrl) {
  if (!looksLikeHttpUrl(tabUrl) && !tabId) {
    return { ok: false, error: "Open the World First AWB Entry tab, then click Autofill." };
  }
  const targetId = await resolveFillTab(tabId, tabUrl);
  try {
    await injectPartnerScripts(targetId);
  } catch (error) {
    const host = hostFromUrl(tabUrl) || tabUrl;
    return {
      ok: false,
      error: `This tab is not allowed yet (${host}). Reload XGoo Partner Sync on chrome://extensions, then retry Autofill.`,
    };
  }
  return fillAllFrames(targetId);
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
        const portalUrl = entry.payload?.portalUrl || "";
        if (hostname && !hostMatchesPartner(hostname, partnerCode, portalUrl)) {
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

      if (message?.type === "XGOO_FILL_TAB") {
        const tabId = message.tabId;
        if (!tabId) {
          sendResponse({ ok: false, error: "No tab to fill." });
          return;
        }
        const result = await fillTab(tabId, message.url || "");
        sendResponse(result);
        return;
      }

      sendResponse({ ok: false, error: "Unknown message" });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true;
});

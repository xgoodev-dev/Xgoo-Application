/** Keep in sync with shared/partner-sync.ts */
var XGOO_EXTENSION_MESSAGE_TYPE = "XGOO_PARTNER_SYNC_V1";
var XGOO_EXTENSION_PING = "XGOO_EXTENSION_PING";
var XGOO_EXTENSION_PONG = "XGOO_EXTENSION_PONG";
var XGOO_EXTENSION_STORED = "XGOO_EXTENSION_STORED";
var XGOO_STORAGE_KEY = "xgoo_pending_payload";
var XGOO_PAYLOAD_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function xgooExtensionAlive() {
  try {
    return typeof chrome !== "undefined" && !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

function xgooStorePendingPayload(payload, callback) {
  const done = (ok, err) => {
    if (typeof callback === "function") callback(ok, err);
  };
  if (!payload?.shipmentId) {
    done(false, "Invalid payload");
    return;
  }
  if (!xgooExtensionAlive()) {
    done(false, "Extension reloaded. Refresh this page.");
    return;
  }
  const entry = {
    payload,
    storedAt: Date.now(),
    sourceTabId: null,
  };
  try {
    chrome.storage.local.set({ [XGOO_STORAGE_KEY]: entry }, () => {
      let err = null;
      try {
        err = chrome.runtime.lastError?.message || null;
      } catch {
        err = "Could not store booking.";
      }
      done(!err, err);
    });
  } catch (error) {
    done(false, error && error.message ? error.message : "Could not store booking.");
  }
}

function xgooSendRuntimeMessage(message, callback) {
  const done = (response, err) => {
    if (typeof callback === "function") callback(response, err);
  };

  if (!xgooExtensionAlive()) {
    done(null, "Extension reloaded. Refresh this page.");
    return;
  }

  try {
    const result = chrome.runtime.sendMessage(message);
    if (result && typeof result.then === "function") {
      result.then((response) => done(response, null)).catch((error) => {
        done(null, error && error.message ? error.message : "Extension reloaded. Refresh this page.");
      });
      return;
    }
    done(result || { ok: true }, null);
  } catch (error) {
    done(null, error && error.message ? error.message : "Extension reloaded. Refresh this page.");
  }
}


(function () {
  const BANNER_ID = "xgoo-partner-sync-banner";

  function createBanner(payload, onFill, onDismiss) {
    if (document.getElementById(BANNER_ID)) return;

    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 16px;font:14px system-ui,sans-serif;background:#0a0a0a;color:#fafafa;border-bottom:3px solid #f97316;box-shadow:0 2px 12px rgba(0,0,0,.25);";

    const text = document.createElement("span");
    text.textContent = `XGoo: Fill booking ${payload.bookingNumber} for ${payload.partnerName || payload.partnerCode}?`;

    const fillBtn = document.createElement("button");
    fillBtn.type = "button";
    fillBtn.textContent = "Autofill";
    fillBtn.style.cssText =
      "cursor:pointer;padding:6px 14px;font:inherit;font-weight:600;background:#f97316;color:#000;border:none;";
    fillBtn.addEventListener("click", onFill);

    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.textContent = "Dismiss";
    dismissBtn.style.cssText =
      "cursor:pointer;padding:6px 14px;font:inherit;background:transparent;color:#fafafa;border:1px solid #525252;";
    dismissBtn.addEventListener("click", onDismiss);

    banner.appendChild(text);
    banner.appendChild(fillBtn);
    banner.appendChild(dismissBtn);
    document.body.appendChild(banner);
  }

  function removeBanner() {
    document.getElementById(BANNER_ID)?.remove();
  }

  function requestPayload(cb) {
    chrome.runtime.sendMessage(
      { type: "XGOO_GET_PAYLOAD", hostname: window.location.hostname },
      (response) => {
        if (chrome.runtime.lastError) {
          cb(null, chrome.runtime.lastError.message);
          return;
        }
        if (!response?.ok || !response.payload) {
          cb(null, response?.mismatch ? "Partner mismatch" : "No pending booking");
          return;
        }
        cb(response.payload, null);
      },
    );
  }

  function doFill(payload) {
    const result = runAutofill(payload);
    if (result.filled > 0) {
      showToast(`XGoo filled ${result.filled} field(s). Review and submit on the partner site.`);
      removeBanner();
    } else {
      showToast(
        "XGoo could not match form fields. Portal layout may have changed — fill manually.",
        true,
      );
    }
    return result;
  }

  function tryShowBanner() {
    requestPayload((payload, err) => {
      if (!payload) return;

      createBanner(
        payload,
        () => doFill(payload),
        () => removeBanner(),
      );
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "XGOO_FILL_CURRENT_TAB") {
      requestPayload((payload, err) => {
        if (!payload) {
          sendResponse({ ok: false, error: err || "No payload" });
          return;
        }
        const result = doFill(payload);
        sendResponse({ ok: result.filled > 0, ...result });
      });
      return true;
    }
    return false;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryShowBanner);
  } else {
    tryShowBanner();
  }

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      removeBanner();
      setTimeout(tryShowBanner, 800);
    }
  }, 1000);
})();

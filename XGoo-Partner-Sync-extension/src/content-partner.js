(function () {
  if (window.__xgooPartnerSyncInjected) return;
  window.__xgooPartnerSyncInjected = true;

  const BANNER_ID = "xgoo-partner-sync-banner";

  function looksLikeLoginPage() {
    if (/shipentry|customershipentry|awb/i.test(location.pathname)) return false;
    const password = document.querySelector('input[type="password"]');
    if (!password) return false;
    const text = (document.body?.innerText || "").toLowerCase();
    if (text.includes("consignee details") || text.includes("shipper details")) return false;
    return (
      text.includes("login with otp") ||
      text.includes("welcome to world first") ||
      ((text.includes("username") || text.includes("user id")) && text.includes("password"))
    );
  }

  function createBanner(payload, onFill, onDismiss, mode) {
    if (document.getElementById(BANNER_ID)) return;
    const isLogin = mode === "login";

    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 16px;font:14px system-ui,sans-serif;background:#0a0a0a;color:#fafafa;border-bottom:3px solid #f97316;box-shadow:0 2px 12px rgba(0,0,0,.25);";

    const text = document.createElement("span");
    text.textContent = isLogin
      ? `XGoo: ${payload.bookingNumber} — if your password is saved, click Login. OTP is optional. Autofill starts on the booking form.`
      : `XGoo: Fill booking ${payload.bookingNumber} for ${payload.partnerName || payload.partnerCode}?`;

    banner.appendChild(text);

    if (!isLogin) {
      const fillBtn = document.createElement("button");
      fillBtn.type = "button";
      fillBtn.textContent = "Autofill";
      fillBtn.style.cssText =
        "cursor:pointer;padding:6px 14px;font:inherit;font-weight:600;background:#f97316;color:#000;border:none;";
      fillBtn.addEventListener("click", onFill);
      banner.appendChild(fillBtn);
    }

    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.textContent = "Dismiss";
    dismissBtn.style.cssText =
      "cursor:pointer;padding:6px 14px;font:inherit;background:transparent;color:#fafafa;border:1px solid #525252;";
    dismissBtn.addEventListener("click", onDismiss);
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

  function fillWithStoredPayload() {
    return new Promise((resolve) => {
      if (looksLikeLoginPage()) {
        resolve({
          ok: false,
          filled: 0,
          error: "This is the login page. Click Login if your password is saved, then Autofill on AWB Entry.",
        });
        return;
      }
      requestPayload((payload, err) => {
        if (!payload) {
          resolve({ ok: false, filled: 0, error: err || "No pending booking" });
          return;
        }
        const result = doFill(payload);
        resolve({ ok: result.filled > 0, filled: result.filled, adapter: result.adapter });
      });
    });
  }

  window.__xgooFillNow = fillWithStoredPayload;

  function tryShowBanner() {
    requestPayload((payload, err) => {
      if (!payload) return;

      createBanner(
        payload,
        () => doFill(payload),
        () => removeBanner(),
        looksLikeLoginPage() ? "login" : "fill",
      );
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "XGOO_FILL_CURRENT_TAB") {
      fillWithStoredPayload().then(sendResponse);
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

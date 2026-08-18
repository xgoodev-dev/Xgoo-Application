(function () {
  try {
    document.documentElement.dataset.xgooExtension = "1";
  } catch {
    return;
  }

  window.addEventListener("message", (event) => {
    try {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === XGOO_EXTENSION_PING) {
        if (typeof xgooExtensionAlive === "function" && !xgooExtensionAlive()) return;
        window.postMessage({ type: XGOO_EXTENSION_PONG, version: "1.2.0" }, window.location.origin);
        return;
      }

      if (data.type === XGOO_EXTENSION_MESSAGE_TYPE && data.payload) {
        const payload = data.payload;
        const announce = (ok, error) => {
          try {
            window.postMessage(
              {
                type: XGOO_EXTENSION_STORED,
                ok: ok === true,
                shipmentId: payload.shipmentId,
                error: error || undefined,
              },
              window.location.origin,
            );
          } catch {
            /* page navigated */
          }
        };

        if (typeof xgooStorePendingPayload === "function") {
          xgooStorePendingPayload(payload, (ok, err) => {
            announce(ok, err);
            if (ok && typeof xgooSendRuntimeMessage === "function") {
              xgooSendRuntimeMessage({ type: "XGOO_STORE_PAYLOAD", payload }, () => {});
            }
          });
          return;
        }

        if (typeof xgooSendRuntimeMessage !== "function") {
          announce(false, "Extension reloaded. Refresh this page.");
          return;
        }
        xgooSendRuntimeMessage({ type: "XGOO_STORE_PAYLOAD", payload }, (response, err) => {
          announce(!err && response?.ok === true, err);
        });
      }
    } catch {
      /* ignore stale extension context */
    }
  });
})();

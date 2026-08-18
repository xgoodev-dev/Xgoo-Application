(function () {
  document.documentElement.dataset.xgooExtension = "1";

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;

    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === XGOO_EXTENSION_PING) {
      window.postMessage({ type: XGOO_EXTENSION_PONG, version: "1.0.0" }, window.location.origin);
      return;
    }

    if (data.type === XGOO_EXTENSION_MESSAGE_TYPE && data.payload) {
      chrome.runtime.sendMessage(
        { type: "XGOO_STORE_PAYLOAD", payload: data.payload },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn("[XGoo extension]", chrome.runtime.lastError.message);
            return;
          }
          window.postMessage(
            {
              type: "XGOO_EXTENSION_STORED",
              ok: response?.ok === true,
              shipmentId: data.payload.shipmentId,
            },
            window.location.origin,
          );
        },
      );
    }
  });
})();

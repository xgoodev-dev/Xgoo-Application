const statusEl = document.getElementById("status");
const infoEl = document.getElementById("payload-info");
const bookingEl = document.getElementById("booking");
const partnerEl = document.getElementById("partner");
const fillBtn = document.getElementById("fill-tab");
const clearBtn = document.getElementById("clear");

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#fca5a5" : "#a1a1aa";
}

async function refresh() {
  const response = await chrome.runtime.sendMessage({ type: "XGOO_GET_STATUS" });

  if (!response?.hasPayload) {
    infoEl.classList.add("hidden");
    fillBtn.disabled = true;
    clearBtn.disabled = true;
    setStatus("No pending booking from XGoo.");
    return;
  }

  const p = response.payload;
  infoEl.classList.remove("hidden");
  bookingEl.textContent = p.bookingNumber || "—";
  partnerEl.textContent = p.partnerName || p.partnerCode || "—";
  fillBtn.disabled = false;
  clearBtn.disabled = false;
  setStatus("Ready to fill consignee, shipper, and package on the partner form.");
}

fillBtn.addEventListener("click", async () => {
  const [tab] =
    (await chrome.tabs.query({ active: true, lastFocusedWindow: true })) ||
    (await chrome.tabs.query({ active: true, currentWindow: true }));
  if (!tab?.id) {
    setStatus("No active tab.", true);
    return;
  }

  setStatus("Filling To address, From address, and package…");
  try {
    const response = await chrome.runtime.sendMessage({
      type: "XGOO_FILL_TAB",
      tabId: tab.id,
      url: tab.url || "",
    });
    if (response?.ok) {
      setStatus(`Filled ${response.filled} field(s): consignee, shipper, package.`);
    } else {
      setStatus(response?.error || "Autofill failed.", true);
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Autofill failed.", true);
  }
});

clearBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "XGOO_CLEAR_PAYLOAD" });
  await refresh();
});

refresh();

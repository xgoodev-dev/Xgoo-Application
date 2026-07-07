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
  setStatus("Ready to autofill partner portal.");
}

fillBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("No active tab.", true);
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "XGOO_FILL_CURRENT_TAB" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus("Open a supported courier portal tab first.", true);
      return;
    }
    if (response?.ok) {
      setStatus(`Filled ${response.filled} field(s) on this tab.`);
    } else {
      setStatus(response?.error || "Autofill failed.", true);
    }
  });
});

clearBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "XGOO_CLEAR_PAYLOAD" });
  await refresh();
});

refresh();

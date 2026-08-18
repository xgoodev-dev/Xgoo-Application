var XGOO_ADAPTERS = [XgooDelhiveryAdapter, XgooWorldFirstAdapter, XgooGenericAdapter];

function pickAdapter(hostname, partnerCode) {
  const code = (partnerCode || "").trim().toUpperCase();
  if (code === "DEL" || code === "DELHIVERY") {
    const d = XGOO_ADAPTERS.find((a) => a.id === "delhivery");
    if (d?.matches(hostname)) return d;
  }
  if (code === "WF" || code === "WFC" || code === "WORLDFIRST" || code === "WORLD FIRST") {
    const wf = XGOO_ADAPTERS.find((a) => a.id === "world-first");
    if (wf?.matches(hostname)) return wf;
  }

  for (const adapter of XGOO_ADAPTERS) {
    if (adapter.id !== "generic" && adapter.matches(hostname)) return adapter;
  }
  return XgooGenericAdapter;
}

function runAutofill(payload) {
  const adapter = pickAdapter(window.location.hostname, payload.partnerCode);
  const count = adapter.fill(payload);
  return { adapter: adapter.id, filled: count };
}

var XGOO_ADAPTERS = [XgooDelhiveryAdapter, XgooGenericAdapter];

function pickAdapter(hostname, partnerCode) {
  const code = (partnerCode || "").trim().toUpperCase();
  if (code === "DEL" || code === "DELHIVERY") {
    const d = XGOO_ADAPTERS.find((a) => a.id === "delhivery");
    if (d?.matches(hostname)) return d;
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

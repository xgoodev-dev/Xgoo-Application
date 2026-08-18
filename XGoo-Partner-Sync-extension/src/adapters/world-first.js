function splitAddressLines(addr) {
  const raw = (addr?.address || "").trim();
  if (!raw) return { line1: "", line2: "" };
  const comma = raw.indexOf(",");
  if (comma > 8 && comma < 80) {
    return { line1: raw.slice(0, comma).trim(), line2: raw.slice(comma + 1).trim() };
  }
  if (raw.length > 80) {
    return { line1: raw.slice(0, 80).trim(), line2: raw.slice(80).trim() };
  }
  return { line1: raw, line2: "" };
}

function fillMappedSection(sectionKey, mappings) {
  let filled = 0;
  for (const [keywords, value] of mappings) {
    if (value == null || value === "") continue;
    if (fillSectionField(sectionKey, keywords, value)) filled += 1;
  }
  return filled;
}

function fillWorldFirstForm(payload) {
  const receiverLines = splitAddressLines(payload.receiver);
  const senderLines = splitAddressLines(payload.sender);
  const city = payload.receiver?.city || "";
  const origin = payload.sender?.city || "";

  // Consignee / To address first — never AWB.
  let filled = fillMappedSection("consignee", [
    [["destination", "dest"], city],
    [["company name", "company"], payload.receiver?.name],
    [["contact name", "contact"], payload.receiver?.name],
    [["address 1", "address1", "addr 1"], receiverLines.line1 || payload.receiver?.address],
    [["address 2", "address2", "addr 2"], receiverLines.line2],
    [["pincode", "pin code", "pin"], payload.receiver?.pincode],
    [["city"], payload.receiver?.city],
    [["state"], payload.receiver?.state],
    [["mobile"], payload.receiver?.phone],
    [["telephone", "tel"], payload.receiver?.phone],
    [["country"], "INDIA"],
  ]);

  if (city && city !== city.toUpperCase()) {
    if (fillSectionField("consignee", ["destination"], city.toUpperCase())) filled += 1;
  }

  filled += fillMappedSection("services", [
    [["shipment value", "invoice value", "declared"], payload.declaredValue],
    [["pieces", "no of pieces", "no. of pieces"], payload.numberOfPieces],
    [["actual weight", "act weight"], payload.chargeableWeight || payload.weight],
    [["charge weight", "chrg weight"], payload.chargeableWeight || payload.weight],
  ]);

  filled += fillMappedSection("shipper", [
    [["origin"], origin],
    [["company name", "company"], payload.sender?.name],
    [["contact name", "contact"], payload.sender?.name],
    [["address 1", "address1", "addr 1"], senderLines.line1 || payload.sender?.address],
    [["address 2", "address2", "addr 2"], senderLines.line2],
    [["pincode", "pin code", "pin"], payload.sender?.pincode],
    [["city"], payload.sender?.city],
    [["state"], payload.sender?.state],
    [["mobile"], payload.sender?.phone],
    [["telephone", "tel"], payload.sender?.phone],
    [["country"], "INDIA"],
  ]);

  return filled;
}

var XgooWorldFirstAdapter = {
  id: "world-first",
  matches(hostname) {
    const host = (hostname || "").toLowerCase();
    return host.includes("worldfirst") || host.includes("xpresion") || host.includes("xpression");
  },
  fill(payload) {
    return fillWorldFirstForm(payload);
  },
};

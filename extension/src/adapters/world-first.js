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
  for (const row of mappings) {
    const keywords = row[0];
    const value = row[1];
    const opts = row[2] || {};
    if (value == null || value === "") continue;
    if (fillSectionField(sectionKey, keywords, value, opts)) filled += 1;
  }
  return filled;
}

function fillWorldFirstForm(payload) {
  const receiverLines = splitAddressLines(payload.receiver);
  const senderLines = splitAddressLines(payload.sender);
  const city = payload.receiver?.city || "";
  const origin = payload.sender?.city || "";
  const weight = payload.chargeableWeight || payload.weight;
  const pieces = payload.numberOfPieces ?? 1;

  let filled = fillMappedSection("consignee", [
    [["destination"], city],
    [["company name", "company"], payload.receiver?.name, { reject: ["client"] }],
    [["contact name"], payload.receiver?.name, { reject: ["address", "company", "telephone", "mobile"] }],
    [["address 1", "address1", "addr 1"], receiverLines.line1 || payload.receiver?.address, { reject: ["address 2"] }],
    [["address 2", "address2", "addr 2"], receiverLines.line2, { reject: ["address 1"] }],
    [["pincode", "pin code"], payload.receiver?.pincode],
    [["city"], payload.receiver?.city, { reject: ["pincode", "state"] }],
    [["state"], payload.receiver?.state, { reject: ["statement"] }],
    [["mobile no", "mobile"], payload.receiver?.phone, { reject: ["telephone"] }],
    [["telephone", "tel"], payload.receiver?.phone, { reject: ["mobile"] }],
    [["country"], "INDIA", { reject: ["iec", "document", "gst"] }],
  ]);

  filled += fillMappedSection("services", [
    [["shipment value", "invoice value", "declared value"], payload.declaredValue, { reject: ["gst invoice"] }],
    [["pieces"], pieces, { reject: ["no. of pieces", "no of pieces"] }],
    [["actual weight"], weight, { reject: ["volumetric", "charge"] }],
    [["charge weight", "chrg weight"], weight, { reject: ["volumetric"] }],
    [["volumetric weight"], payload.volumetricWeight, { reject: ["discount"] }],
  ]);

  filled += fillMappedSection("pieces", [
    [["measurement unit"], "Centimeter"],
    [["actl weight", "actual weight"], weight, { reject: ["volumetric", "charge"] }],
    [["no. of pieces", "no of pieces", "number of pieces"], pieces],
    [["length"], payload.length, { reject: ["telephone"] }],
    [["width", "breadth"], payload.width],
    [["height"], payload.height],
  ]);

  filled += fillMappedSection("performa", [
    [["description"], payload.contentDescription, { reject: ["export reason", "charge"] }],
    [["quantity"], pieces, { reject: ["weight"] }],
    [["weight"], payload.weight, { reject: ["volumetric", "charge", "actl"] }],
    [["packages", "package"], pieces, { reject: ["description"] }],
  ]);

  filled += fillMappedSection("shipment", [
    [["reference"], payload.bookingNumber, { reject: ["invoice"] }],
    [["content"], payload.contentDescription, { reject: ["instruction"] }],
  ]);

  filled += fillMappedSection("shipper", [
    [["origin"], origin, { reject: ["destination"] }],
    [["contact name"], payload.sender?.name, { reject: ["address", "company", "client", "telephone", "mobile"] }],
    [["address 1", "address1", "addr 1"], senderLines.line1 || payload.sender?.address, { reject: ["address 2"] }],
    [["address 2", "address2", "addr 2"], senderLines.line2, { reject: ["address 1"] }],
    [["pincode", "pin code"], payload.sender?.pincode],
    [["city"], payload.sender?.city, { reject: ["pincode", "state"] }],
    [["state"], payload.sender?.state, { reject: ["statement"] }],
    [["mobile no", "mobile"], payload.sender?.phone, { reject: ["telephone"] }],
    [["telephone", "tel"], payload.sender?.phone, { reject: ["mobile"] }],
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

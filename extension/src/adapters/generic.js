function fillGenericForm(payload) {
  let filled = 0;

  const senderFields = [
    [["sender", "shipper", "pickup", "from"], payload.sender?.name],
    [["sender phone", "shipper phone", "pickup phone", "from mobile", "sender mobile"], payload.sender?.phone],
    [["sender address", "shipper address", "pickup address", "from address"], joinAddress(payload.sender)],
    [["sender pin", "shipper pin", "pickup pin", "from pin", "origin pin"], payload.sender?.pincode],
    [["sender city", "shipper city", "from city"], payload.sender?.city],
    [["sender state", "shipper state", "from state"], payload.sender?.state],
  ];

  const receiverFields = [
    [["consignee", "receiver", "recipient", "deliver to", "destination name"], payload.receiver?.name],
    [["consignee phone", "receiver phone", "recipient phone", "mobile", "consignee mobile"], payload.receiver?.phone],
    [["consignee address", "receiver address", "delivery address", "destination address"], joinAddress(payload.receiver)],
    [["consignee pin", "receiver pin", "destination pin", "pincode", "pin code"], payload.receiver?.pincode],
    [["consignee city", "receiver city", "destination city"], payload.receiver?.city],
    [["consignee state", "receiver state", "destination state"], payload.receiver?.state],
  ];

  const packageFields = [
    [["weight", "actual weight", "shipment weight"], payload.chargeableWeight || payload.weight],
    [["length"], payload.length],
    [["width"], payload.width],
    [["height"], payload.height],
    [["pieces", "quantity", "no of pieces", "number of pieces"], payload.numberOfPieces],
    [["description", "content", "product", "commodity", "item description"], payload.contentDescription],
    [["declared value", "invoice value", "value"], payload.declaredValue],
    [["reference", "order id", "order ref", "booking"], payload.bookingNumber],
  ];

  for (const [keywords, value] of [...senderFields, ...receiverFields, ...packageFields]) {
    if (value == null || value === "") continue;
    if (fillField(keywords, value)) filled += 1;
  }

  if (payload.serviceType) {
    const service = payload.serviceType.toLowerCase();
    if (service === "air") {
      if (fillField(["air", "express", "air mode"], "air")) filled += 1;
    } else if (service === "surface") {
      if (fillField(["surface", "road", "standard"], "surface")) filled += 1;
    }
  }

  return filled;
}

var XgooGenericAdapter = {
  id: "generic",
  matches(hostname) {
    return true;
  },
  fill(payload) {
    return fillGenericForm(payload);
  },
};

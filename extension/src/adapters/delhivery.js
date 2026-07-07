function fillDelhiveryForm(payload) {
  let filled = fillGenericForm(payload);

  const delhiveryExtras = [
    [["customer name", "name"], payload.receiver?.name],
    [["phone number", "mobile number"], payload.receiver?.phone],
    [["address line", "full address"], payload.receiver?.address],
    [["pin code", "pincode", "zip"], payload.receiver?.pincode],
    [["product details", "shipment content"], payload.contentDescription],
    [["cod amount"], "0"],
  ];

  for (const [keywords, value] of delhiveryExtras) {
    if (value == null || value === "") continue;
    if (fillField(keywords, value)) filled += 1;
  }

  return filled;
}

var XgooDelhiveryAdapter = {
  id: "delhivery",
  matches(hostname) {
    return (hostname || "").toLowerCase().includes("delhivery");
  },
  fill(payload) {
    return fillDelhiveryForm(payload);
  },
};

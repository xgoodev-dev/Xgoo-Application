import type { Shipment } from "./schema";

export const DELHIVERY_DEFAULT_BASE_URL = "https://staging-express.delhivery.com";

export function isDelhiveryPartner(code?: string | null, name?: string | null): boolean {
  const c = (code ?? "").trim().toUpperCase();
  if (c === "DEL" || c === "DELHIVERY" || c === "DL") return true;
  return (name ?? "").toLowerCase().includes("delhivery");
}

export interface DelhiveryCreateInput {
  shipment: Shipment;
  pickupLocation: string;
}

export function buildDelhiveryShipmentBody(input: DelhiveryCreateInput) {
  const { shipment, pickupLocation } = input;
  const weightKg = parseFloat(String(shipment.chargeableWeight ?? shipment.weight ?? "0.5"));
  const weightGm = Math.max(1, Math.round(weightKg * 1000));

  return {
    shipments: [
      {
        name: shipment.receiverName,
        add: shipment.receiverAddress,
        pin: shipment.receiverPincode ?? "",
        city: shipment.receiverCity ?? "",
        state: shipment.receiverState ?? "",
        country: "India",
        phone: shipment.receiverPhone,
        order: shipment.bookingNumber,
        payment_mode: "Prepaid",
        products_desc: shipment.contentDescription ?? "General goods",
        quantity: String(shipment.numberOfPieces ?? 1),
        weight: String(weightGm),
        cod_amount: "0",
        shipping_mode: shipment.serviceType === "air" ? "Express" : "Surface",
      },
    ],
    pickup_location: { name: pickupLocation },
  };
}

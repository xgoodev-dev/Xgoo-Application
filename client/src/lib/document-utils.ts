import type { Office, Quotation, ShipmentWithRelations } from "@shared/schema";
import {
  DEFAULT_DOCUMENT_SETTINGS,
  mergeDocumentSettings,
  parseShipmentPackages,
  type DocumentSettings,
  type XgooDocumentData,
  type XgooDocumentPackageLine,
} from "@shared/document-template";

export function formatDocCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return "0/-";
  return `${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/-`;
}

export function formatDocDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export function getOfficeDocumentSettings(office: Office | null | undefined): DocumentSettings {
  return mergeDocumentSettings((office as Office & { documentSettings?: unknown })?.documentSettings);
}

export function officeHeaderLines(office: Office): string[] {
  const lines: string[] = [];
  if (office.address) lines.push(office.address);
  const cityLine = [office.city, office.state, office.pincode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  return lines;
}

function partyFromShipmentSender(s: ShipmentWithRelations) {
  const lines = [s.senderAddress];
  const loc = [s.senderCity, s.senderState, s.senderPincode].filter(Boolean).join(" - ");
  if (loc) lines.push(loc);
  return { name: s.senderName, lines: lines.filter(Boolean) };
}

function partyFromShipmentReceiver(s: ShipmentWithRelations) {
  const lines = [s.receiverAddress];
  const loc = [s.receiverCity, s.receiverState, s.receiverPincode].filter(Boolean).join(" - ");
  if (loc) lines.push(loc);
  return { name: s.receiverName, lines: lines.filter(Boolean) };
}

export function shipmentToDocument(
  shipment: ShipmentWithRelations,
  office: Office,
  serialNumber: string,
  settings: DocumentSettings = getOfficeDocumentSettings(office),
  docKind: "invoice" | "bill" = "invoice",
): XgooDocumentData {
  const base = parseFloat(shipment.baseAmount || "0");
  const extra = parseFloat(shipment.additionalCharges || "0");
  const subtotal = base + extra;
  const gstAmount = parseFloat(shipment.gstAmount || "0") || Math.round(subtotal * settings.gstRate) / 100;
  const total = parseFloat(shipment.totalAmount || "0") || subtotal + gstAmount;
  const weight = parseFloat(shipment.weight || "0");
  const pieces = shipment.numberOfPieces || 1;
  const ratePerKg = weight > 0 ? Math.round(subtotal / weight) : subtotal;
  const dims =
    shipment.length && shipment.width && shipment.height
      ? `${shipment.length}x${shipment.width}x${shipment.height} CMS`
      : shipment.contentDescription || "";

  const toN = (v: unknown) => {
    const n = parseFloat(String(v ?? ""));
    return Number.isFinite(n) ? n : 0;
  };

  const rawPackages = parseShipmentPackages(
    (shipment as ShipmentWithRelations & { packages?: unknown }).packages,
  );

  const packageLines: XgooDocumentPackageLine[] =
    rawPackages.length > 0
      ? rawPackages.map((p) => {
          const w = toN(p.weight);
          const count = Math.max(1, parseInt(String(p.numberOfPieces ?? "1"), 10) || 1);
          const rowDims =
            p.length && p.width && p.height
              ? `${p.length}x${p.width}x${p.height} CMS`
              : "";
          const content = (p.contentDescription || "").trim();
          const descParts = [content, rowDims].filter(Boolean);
          return {
            count,
            description: descParts.join(" · ") || `${w}Kg`,
            amount: subtotal,
            weight: w,
            dimensions: rowDims,
            content,
            declaredValue: toN(p.declaredValue),
          };
        })
      : [
          {
            count: pieces,
            description: dims
              ? `${pieces} Parcel${pieces > 1 ? "s" : ""} · ${weight}KgX${ratePerKg} · ${dims}`
              : `${weight}KgX${ratePerKg}`,
            amount: subtotal,
            weight,
            dimensions:
              shipment.length && shipment.width && shipment.height
                ? `${shipment.length}x${shipment.width}x${shipment.height} CMS`
                : "",
            content: (shipment.contentDescription || "").trim(),
            declaredValue: toN(shipment.declaredValue),
          },
        ];

  return {
    kind: docKind,
    title: docKind === "bill" ? settings.billTitle : settings.invoiceTitle,
    serialNumber,
    date: shipment.bookedAt || new Date(),
    awbNumber: shipment.awbNumber,
    consigner: partyFromShipmentSender(shipment),
    consignee: partyFromShipmentReceiver(shipment),
    courierScope: settings.defaultCourierScope,
    packageType: settings.defaultPackageType,
    packageLine: packageLines[0],
    packageLines,
    subtotal,
    gstRate: settings.gstRate,
    gstAmount,
    totalAmount: total,
    notes: shipment.contentDescription,
  };
}

export function quotationToDocument(
  quotation: Quotation,
  office: Office,
  settings: DocumentSettings = getOfficeDocumentSettings(office)
): XgooDocumentData {
  const base = parseFloat(quotation.baseAmount || "0");
  const extra = parseFloat(quotation.additionalCharges || "0");
  const subtotal = base + extra;
  const gstAmount = parseFloat(quotation.gstAmount || "0") || Math.round(subtotal * settings.gstRate) / 100;
  const total = parseFloat(quotation.totalAmount || "0") || subtotal + gstAmount;
  const weight = parseFloat(quotation.weight || "0");
  const pieces = quotation.numberOfPieces || 1;
  const ratePerKg = weight > 0 ? Math.round(subtotal / weight) : subtotal;
  const senderLoc = [quotation.senderCity, quotation.senderState, quotation.senderPincode].filter(Boolean).join(" - ");
  const receiverLoc = [quotation.receiverCity, quotation.receiverState, quotation.receiverPincode].filter(Boolean).join(" - ");

  const quotationPackageLine: XgooDocumentPackageLine = {
    count: pieces,
    description: quotation.contentDescription || `${weight}KgX${ratePerKg}`,
    amount: subtotal,
    weight,
    dimensions: "",
    content: (quotation.contentDescription || "").trim(),
    declaredValue: parseFloat(quotation.declaredValue || "0") || 0,
  };

  return {
    kind: "quotation",
    title: settings.quotationTitle,
    serialNumber: quotation.quotationNumber,
    date: quotation.createdAt || new Date(),
    awbNumber: null,
    consigner: {
      name: quotation.customerName,
      lines: senderLoc ? [senderLoc] : [],
    },
    consignee: {
      name: quotation.customerName,
      lines: receiverLoc ? [receiverLoc] : [],
    },
    courierScope: quotation.serviceType === "air" ? "international" : settings.defaultCourierScope,
    packageType: settings.defaultPackageType,
    packageLine: quotationPackageLine,
    packageLines: [quotationPackageLine],
    subtotal,
    gstRate: settings.gstRate,
    gstAmount,
    totalAmount: total,
    validUntil: quotation.validUntil,
    notes: quotation.notes,
  };
}

export { DEFAULT_DOCUMENT_SETTINGS };

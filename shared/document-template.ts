import { z } from "zod";

export const documentSettingsSchema = z.object({
  invoiceTitle: z.string().default("Receipt"),
  billTitle: z.string().default("Booking Bill"),
  quotationTitle: z.string().default("Quotation"),
  serialPrefix: z.string().default("XGC"),
  gstRate: z.number().min(0).max(100).default(18),
  contactEmail: z.string().default("connect@xgoo.in"),
  website: z.string().default("www.xgoo.in"),
  termsAndConditions: z.string().default(
    "All services are subject to XGoo's Terms and Conditions, which can be found on our website www.xgoo.in. By making payment, you agree to these terms."
  ),
  contactNotice: z.string().default(
    "For any questions or concerns regarding this invoice, please contact us at connect@xgoo.in"
  ),
  defaultCourierScope: z.enum(["domestic", "international"]).default("domestic"),
  defaultPackageType: z.enum(["dox", "non_dox"]).default("non_dox"),
  showSignatures: z.boolean().default(true),
  brandColor: z.string().default("#FF4907"),
  footerNote: z.string().optional(),
});

export type DocumentSettings = z.infer<typeof documentSettingsSchema>;

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = documentSettingsSchema.parse({});

export function mergeDocumentSettings(raw: unknown): DocumentSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_DOCUMENT_SETTINGS };
  const parsed = documentSettingsSchema.safeParse({ ...DEFAULT_DOCUMENT_SETTINGS, ...raw });
  return parsed.success ? parsed.data : { ...DEFAULT_DOCUMENT_SETTINGS };
}

export interface XgooDocumentParty {
  name: string;
  lines: string[];
}

export interface XgooDocumentPackageLine {
  count: number;
  description: string;
  amount: number;
  weight?: number;
  dimensions?: string;
  content?: string;
  declaredValue?: number;
}

/** A single package/parcel captured at booking time. */
export interface ShipmentPackage {
  weight?: string | number | null;
  length?: string | number | null;
  width?: string | number | null;
  height?: string | number | null;
  numberOfPieces?: string | number | null;
  contentDescription?: string | null;
  declaredValue?: string | number | null;
}

export const shipmentPackageSchema = z.object({
  weight: z.union([z.string(), z.number()]).optional().nullable(),
  length: z.union([z.string(), z.number()]).optional().nullable(),
  width: z.union([z.string(), z.number()]).optional().nullable(),
  height: z.union([z.string(), z.number()]).optional().nullable(),
  numberOfPieces: z.union([z.string(), z.number()]).optional().nullable(),
  contentDescription: z.string().optional().nullable(),
  declaredValue: z.union([z.string(), z.number()]).optional().nullable(),
});

export function parseShipmentPackages(raw: unknown): ShipmentPackage[] {
  if (!Array.isArray(raw)) return [];
  const parsed = z.array(shipmentPackageSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export interface XgooDocumentData {
  kind: "invoice" | "bill" | "quotation";
  title: string;
  serialNumber: string;
  date: Date | string;
  awbNumber?: string | null;
  consigner: XgooDocumentParty;
  consignee: XgooDocumentParty;
  courierScope: "domestic" | "international";
  packageType: "dox" | "non_dox";
  packageLine: XgooDocumentPackageLine;
  packageLines: XgooDocumentPackageLine[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  validUntil?: Date | string | null;
  notes?: string | null;
}

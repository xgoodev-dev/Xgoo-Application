import { z } from "zod";
import { emptyHubProduct, hubProductLineSchema } from "@shared/hub-booking";

export const hubBookingFormSchema = z
  .object({
    customerId: z.string().optional(),
    courierPartnerId: z.string().min(1, "Please select a courier partner"),
    awbNumber: z.string().optional(),
    shipmentType: z.enum(["domestic", "international"]),
    destinationCountry: z.string().optional(),
    pickupLocationName: z.string().optional(),
    channelOrderId: z.string().optional(),
    orderDate: z.string().optional(),
    senderName: z.string().min(1, "Sender name is required"),
    senderPhone: z.string().min(10, "Valid phone number required"),
    senderEmail: z.string().optional(),
    senderAlternatePhone: z.string().optional(),
    senderAddress: z.string().min(1, "Sender address is required"),
    senderAddressLine2: z.string().optional(),
    senderLandmark: z.string().optional(),
    senderCity: z.string().optional(),
    senderState: z.string().optional(),
    senderPincode: z.string().optional(),
    senderCountry: z.string().optional(),
    receiverName: z.string().min(1, "Receiver name is required"),
    receiverPhone: z.string().min(10, "Valid phone number required"),
    receiverEmail: z.string().optional(),
    receiverAlternatePhone: z.string().optional(),
    receiverAddress: z.string().min(1, "Receiver address is required"),
    receiverAddressLine2: z.string().optional(),
    receiverLandmark: z.string().optional(),
    receiverCity: z.string().optional(),
    receiverState: z.string().optional(),
    receiverPincode: z.string().optional(),
    receiverCountry: z.string().optional(),
    weight: z.string().min(1, "Weight is required"),
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    numberOfPieces: z.string().default("1"),
    contentDescription: z.string().optional(),
    declaredValue: z.string().optional(),
    serviceType: z.enum(["air", "surface"]),
    paymentMode: z.enum(["cash", "upi", "bank_transfer", "credit"]),
    orderPaymentType: z.enum(["prepaid", "cod"]),
    collectableAmount: z.string().optional(),
    shippingCharges: z.string().optional(),
    giftwrapCharges: z.string().optional(),
    transactionCharges: z.string().optional(),
    resellerName: z.string().optional(),
    products: z.array(hubProductLineSchema),
    customsDocumentType: z.enum(["csb4", "csb5"]).optional(),
    incoTerms: z.string().optional(),
    invoiceNumber: z.string().optional(),
    invoiceDate: z.string().optional(),
    currency: z.string().optional(),
    gstin: z.string().optional(),
    iec: z.string().optional(),
    ioss: z.string().optional(),
    eori: z.string().optional(),
    shipmentPurpose: z.string().optional(),
    manualAmount: z.string().optional(),
    packagePhotoUrls: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shipmentType === "international" && !(data.destinationCountry || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationCountry"],
        message: "Destination country is required",
      });
    }
    if (data.orderPaymentType === "cod" && !(data.collectableAmount || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["collectableAmount"],
        message: "Collectable amount is required for COD",
      });
    }
    if (data.shipmentType === "international") {
      data.products.forEach((product, index) => {
        if ((product.name || "").trim() && !(product.hsn || "").trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["products", index, "hsn"],
            message: "HSN is required for international products",
          });
        }
      });
    }
  });

export type HubBookingFormData = z.infer<typeof hubBookingFormSchema>;

export function hubBookingDefaultValues(): HubBookingFormData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    courierPartnerId: "",
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    serviceType: "surface",
    paymentMode: "cash",
    numberOfPieces: "1",
    weight: "",
    packagePhotoUrls: [],
    shipmentType: "domestic",
    destinationCountry: "",
    pickupLocationName: "",
    channelOrderId: "",
    orderDate: today,
    senderEmail: "",
    senderAlternatePhone: "",
    senderAddressLine2: "",
    senderLandmark: "",
    senderCountry: "India",
    receiverEmail: "",
    receiverAlternatePhone: "",
    receiverAddressLine2: "",
    receiverLandmark: "",
    receiverCountry: "India",
    orderPaymentType: "prepaid",
    collectableAmount: "",
    shippingCharges: "",
    giftwrapCharges: "",
    transactionCharges: "",
    resellerName: "",
    products: [emptyHubProduct()],
    customsDocumentType: "csb5",
    incoTerms: "DAP",
    invoiceNumber: "",
    invoiceDate: today,
    currency: "INR",
    gstin: "",
    iec: "",
    ioss: "",
    eori: "",
    shipmentPurpose: "Gift",
  };
}

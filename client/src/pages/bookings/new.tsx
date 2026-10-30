import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Scale,
  CreditCard,
  Truck,
  Loader2,
  Sparkles,
  Camera,
  Bot,
  ScanLine,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PackagePhotoCapture } from "@/components/bookings/PackagePhotoCapture";
import { HubBookingAiBar } from "@/components/bookings/hub-booking-ai-bar";
import { HubBookingPartySection } from "@/components/bookings/hub-booking-party-section";
import {
  BOOKING_WIZARD_STEPS,
  BOOKING_WIZARD_STEP_FIELDS,
  BookingWizardFooter,
  BookingWizardStepper,
  bookingWizardStepIndex,
  type BookingWizardStepId,
} from "@/components/bookings/hub-booking-wizard";
import {
  HubBookingCustomsSection,
  HubBookingCourierApiSection,
  HubBookingOrderSection,
  HubBookingPartnerGate,
  HubBookingPaymentSection,
  HubBookingProductSection,
  HubBookingScopeToggle,
  HubBookingWeightSummary,
} from "@/components/bookings/hub-booking-fields";
import { DelhiveryOrderForm } from "@/components/bookings/delhivery-order-form";
import { WorldFirstAwbForm } from "@/components/bookings/world-first-awb-form";
import {
  hubBookingDefaultValues,
  hubBookingFormSchema,
  type HubBookingFormData,
} from "@/components/bookings/hub-booking-schema";
import type { BranchWithServiceAreas, Customer, CourierPartner, Office } from "@shared/schema";
import type { PricingQuoteResult } from "@shared/pricing";
import { isDelhiveryPartner } from "@shared/delhivery";
import { isWorldFirstPartner } from "@shared/world-first";
import { resolveBookingMethod } from "@shared/booking-engine";
import {
  filledProducts,
  packageWeightSummary,
  productsDeclaredValue,
  productsDescription,
  type HubShipmentScope,
} from "@shared/hub-booking";

type BookingFormData = HubBookingFormData;

type DelhiveryStatus = {
  configured: boolean;
  pickupLocation: string | null;
  environment: string;
  clientName?: string | null;
};

type WorldFirstStatus = {
  configured: boolean;
  product?: string | null;
  vendor?: string | null;
  service?: string | null;
  clientId?: string | null;
};

function shouldBookOnCreate(
  partner: CourierPartner | undefined,
  delhiveryStatus: DelhiveryStatus | undefined,
  worldFirstStatus?: WorldFirstStatus,
): boolean {
  if (!partner || resolveBookingMethod(partner) !== "api") return false;
  if (isDelhiveryPartner(partner.code, partner.name)) return !!delhiveryStatus?.configured;
  if (isWorldFirstPartner(partner.code, partner.name)) return !!worldFirstStatus?.configured;
  return true;
}

type ExtraPackageRow = {
  id: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  numberOfPieces: string;
  contentDescription: string;
  declaredValue: string;
};

type PackageColumnKey =
  | "weight"
  | "numberOfPieces"
  | "length"
  | "width"
  | "height"
  | "contentDescription"
  | "declaredValue";

const PACKAGE_COLUMNS: PackageColumnKey[] = [
  "weight",
  "numberOfPieces",
  "length",
  "width",
  "height",
  "contentDescription",
  "declaredValue",
];

const PACKAGE_COLUMN_LABELS: Record<PackageColumnKey, string> = {
  weight: "Weight (kg)",
  numberOfPieces: "Pieces",
  length: "L (cm)",
  width: "W (cm)",
  height: "H (cm)",
  contentDescription: "Content",
  declaredValue: "Value (Rs.)",
};

export default function NewBookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

  const [smartFillText, setSmartFillText] = useState("");
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [sectionAiText, setSectionAiText] = useState<Record<string, string>>({ sender: "", receiver: "", package: "", service: "" });
  const [sectionAiLoading, setSectionAiLoading] = useState<Record<string, boolean>>({ sender: false, receiver: false, package: false, service: false });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isScanningPhotos, setIsScanningPhotos] = useState(false);
  const [wizardStep, setWizardStep] = useState<BookingWizardStepId>("shipment");
  const [recommendation, setRecommendation] = useState<{
    recommendedPartnerId: string;
    reason: string;
    estimatedCost?: string;
    alternativePartnerId?: string;
    alternativeReason?: string;
  } | null>(null);
  const [packagePhotos, setPackagePhotos] = useState<string[]>([]);
  const [extraPackages, setExtraPackages] = useState<ExtraPackageRow[]>([]);

  const [partnerConfirmed, setPartnerConfirmed] = useState(false);
  const [recordingSection, setRecordingSection] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scanPhotosInputRef = useRef<HTMLInputElement>(null);

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: partners, isLoading: partnersLoading } = useQuery<CourierPartner[]>({
    queryKey: ["/api/partners"],
  });
  const { data: delhiveryStatus } = useQuery<DelhiveryStatus>({
    queryKey: ["/api/integrations/delhivery/status"],
  });
  const { data: worldFirstStatus } = useQuery<WorldFirstStatus>({
    queryKey: ["/api/integrations/world-first/status"],
  });
  const { data: branches } = useQuery<BranchWithServiceAreas[]>({
    queryKey: ["/api/branches"],
  });
  const { data: office } = useQuery<Office>({
    queryKey: ["/api/office"],
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(hubBookingFormSchema),
    defaultValues: hubBookingDefaultValues(),
  });

  const [sourceBookingRequestId, setSourceBookingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    const bookingRequestId = params.get("bookingRequestId");
    if (bookingRequestId) setSourceBookingRequestId(bookingRequestId);
    const partnerId = params.get("courierPartnerId") || params.get("partner");
    if (partnerId) {
      form.setValue("courierPartnerId", partnerId, { shouldValidate: true });
      setPartnerConfirmed(true);
    }
    const fromPin = params.get("from") || params.get("senderPincode");
    const toPin = params.get("to") || params.get("receiverPincode");
    if (fromPin && !params.get("senderPincode")) form.setValue("senderPincode", fromPin);
    if (toPin && !params.get("receiverPincode")) {
      form.setValue("receiverPincode", toPin);
    }
    const service = params.get("service") || params.get("serviceType");
    if (service === "air" || service === "surface") form.setValue("serviceType", service);
    const type = params.get("type") || params.get("shipmentType");
    if (type === "domestic" || type === "international") form.setValue("shipmentType", type);

    const textFields = [
      "senderName",
      "senderPhone",
      "senderEmail",
      "senderAlternatePhone",
      "senderAddress",
      "senderAddressLine2",
      "senderLandmark",
      "senderCity",
      "senderState",
      "senderPincode",
      "senderCountry",
      "receiverName",
      "receiverPhone",
      "receiverEmail",
      "receiverAlternatePhone",
      "receiverAddress",
      "receiverAddressLine2",
      "receiverLandmark",
      "receiverCity",
      "receiverState",
      "receiverPincode",
      "receiverCountry",
      "weight",
      "numberOfPieces",
      "length",
      "width",
      "height",
      "contentDescription",
      "declaredValue",
      "serviceType",
      "shipmentType",
      "destinationCountry",
      "pickupLocationName",
      "partnerProduct",
      "partnerVendor",
      "partnerService",
    ] as const;

    for (const key of textFields) {
      const val = params.get(key);
      if (val) form.setValue(key, val);
    }
  }, [form]);

  const selectedPartnerId = form.watch("courierPartnerId");
  const serviceType = form.watch("serviceType");
  const shipmentType = form.watch("shipmentType");
  const weight = form.watch("weight");
  const senderPincode = form.watch("senderPincode");
  const receiverPincode = form.watch("receiverPincode");
  const senderCity = form.watch("senderCity");
  const receiverCity = form.watch("receiverCity");
  const destinationCountry = form.watch("destinationCountry");
  const length = form.watch("length");
  const width = form.watch("width");
  const height = form.watch("height");
  const numberOfPieces = form.watch("numberOfPieces");
  const contentDescription = form.watch("contentDescription");
  const declaredValue = form.watch("declaredValue");

  useEffect(() => {
    if (form.getValues("pickupLocationName")) return;
    const primary = branches?.find((branch) => branch.isPrimary) || branches?.[0];
    if (primary?.name) form.setValue("pickupLocationName", primary.name);
  }, [branches, form]);

  const applyShipmentScope = (scope: HubShipmentScope) => {
    form.setValue("shipmentType", scope, { shouldValidate: true });
    switch (scope) {
      case "domestic":
        form.setValue("senderCountry", form.getValues("senderCountry") || "India");
        form.setValue("receiverCountry", "India");
        form.setValue("destinationCountry", "");
        form.setValue("currency", "INR");
        break;
      case "international":
        form.setValue("senderCountry", form.getValues("senderCountry") || "India");
        if (form.getValues("receiverCountry") === "India") form.setValue("receiverCountry", "");
        form.setValue("orderPaymentType", "prepaid");
        if (!form.getValues("customsDocumentType")) form.setValue("customsDocumentType", "csb5");
        if (!form.getValues("incoTerms")) form.setValue("incoTerms", "DAP");
        break;
      default: {
        const exhaustive: never = scope;
        return exhaustive;
      }
    }
  };

  const toNum = (v?: string) => {
    const n = parseFloat(v || "");
    return Number.isFinite(n) ? n : 0;
  };
  const toInt = (v?: string) => {
    const n = parseInt(v || "", 10);
    return Number.isFinite(n) ? n : 0;
  };

  const packageRows = [
    {
      id: "primary",
      weight: weight || "",
      length: length || "",
      width: width || "",
      height: height || "",
      numberOfPieces: numberOfPieces || "1",
      contentDescription: contentDescription || "",
      declaredValue: declaredValue || "",
      isPrimary: true,
    },
    ...extraPackages.map((p) => ({ ...p, isPrimary: false })),
  ];

  const totalWeight = packageRows.reduce((sum, row) => sum + toNum(row.weight), 0);
  const totalPieces = packageRows.reduce((sum, row) => sum + Math.max(1, toInt(row.numberOfPieces) || 1), 0);
  const maxLength = packageRows.reduce((m, row) => Math.max(m, toNum(row.length)), 0);
  const maxWidth = packageRows.reduce((m, row) => Math.max(m, toNum(row.width)), 0);
  const maxHeight = packageRows.reduce((m, row) => Math.max(m, toNum(row.height)), 0);
  const totalDeclaredValue = packageRows.reduce((sum, row) => sum + toNum(row.declaredValue), 0);
  const combinedDescription = packageRows
    .map((row) => row.contentDescription.trim())
    .filter(Boolean)
    .join(", ");

  const updateExtraPackage = (id: string, field: keyof ExtraPackageRow, value: string) => {
    setExtraPackages((prev) => prev.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg)));
    setTimeout(updateCalculatedAmount, 50);
  };

  const addPackageRow = () => {
    setExtraPackages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        weight: "",
        length: "",
        width: "",
        height: "",
        numberOfPieces: "1",
        contentDescription: "",
        declaredValue: "",
      },
    ]);
  };

  const removePackageRow = (id: string) => {
    setExtraPackages((prev) => prev.filter((pkg) => pkg.id !== id));
    setTimeout(updateCalculatedAmount, 50);
  };

  const renderPackageCell = (
    pkg: (ExtraPackageRow & { isPrimary: boolean }) | (typeof packageRows)[number],
    index: number,
    key: PackageColumnKey,
    testPrefix: string,
  ) => {
    const setPrimary = (
      field: "weight" | "numberOfPieces" | "length" | "width" | "height" | "contentDescription" | "declaredValue",
      value: string,
      validate = false,
    ) => {
      form.setValue(field, value, { shouldDirty: true, shouldValidate: validate });
      setTimeout(updateCalculatedAmount, 30);
    };

    if (key === "weight") {
      return (
        <Input
          type="number"
          step="0.1"
          value={pkg.weight}
          onChange={(e) => {
            if (pkg.isPrimary) setPrimary("weight", e.target.value, true);
            else updateExtraPackage(pkg.id, "weight", e.target.value);
          }}
          data-testid={`${testPrefix}-weight-${index}`}
        />
      );
    }
    if (key === "numberOfPieces") {
      return (
        <Input
          type="number"
          min="1"
          value={pkg.numberOfPieces}
          onChange={(e) => {
            if (pkg.isPrimary) setPrimary("numberOfPieces", e.target.value, true);
            else updateExtraPackage(pkg.id, "numberOfPieces", e.target.value);
          }}
          data-testid={`${testPrefix}-pieces-${index}`}
        />
      );
    }
    if (key === "length") {
      return (
        <Input
          type="number"
          value={pkg.length}
          onChange={(e) => (pkg.isPrimary ? setPrimary("length", e.target.value) : updateExtraPackage(pkg.id, "length", e.target.value))}
          data-testid={`${testPrefix}-length-${index}`}
        />
      );
    }
    if (key === "width") {
      return (
        <Input
          type="number"
          value={pkg.width}
          onChange={(e) => (pkg.isPrimary ? setPrimary("width", e.target.value) : updateExtraPackage(pkg.id, "width", e.target.value))}
          data-testid={`${testPrefix}-width-${index}`}
        />
      );
    }
    if (key === "height") {
      return (
        <Input
          type="number"
          value={pkg.height}
          onChange={(e) => (pkg.isPrimary ? setPrimary("height", e.target.value) : updateExtraPackage(pkg.id, "height", e.target.value))}
          data-testid={`${testPrefix}-height-${index}`}
        />
      );
    }
    if (key === "contentDescription") {
      return (
        <Input
          value={pkg.contentDescription}
          onChange={(e) =>
            pkg.isPrimary
              ? setPrimary("contentDescription", e.target.value)
              : updateExtraPackage(pkg.id, "contentDescription", e.target.value)
          }
          data-testid={`${testPrefix}-content-${index}`}
        />
      );
    }

    return (
      <Input
        type="number"
        value={pkg.declaredValue}
        onChange={(e) =>
          pkg.isPrimary
            ? setPrimary("declaredValue", e.target.value)
            : updateExtraPackage(pkg.id, "declaredValue", e.target.value)
        }
        data-testid={`${testPrefix}-value-${index}`}
      />
    );
  };

  const selectedPartner = partners?.find((p) => p.id === selectedPartnerId);
  const worldFirstBooking = isWorldFirstPartner(selectedPartner?.code, selectedPartner?.name);
  const delhiveryBooking = isDelhiveryPartner(selectedPartner?.code, selectedPartner?.name);
  const bookOnCreate = shouldBookOnCreate(selectedPartner, delhiveryStatus, worldFirstStatus);

  useEffect(() => {
    if (!partnerConfirmed || !selectedPartner) return;
    if (delhiveryBooking) {
      form.setValue("shipmentType", "domestic");
      form.setValue("receiverCountry", "India");
      if (delhiveryStatus?.pickupLocation && !form.getValues("pickupLocationName")) {
        form.setValue("pickupLocationName", delhiveryStatus.pickupLocation);
      }
      const sellerName = delhiveryStatus?.clientName || office?.name;
      if (sellerName && !form.getValues("senderName")) {
        form.setValue("senderName", sellerName);
      }
      if (office?.address && !form.getValues("senderAddress")) {
        form.setValue("senderAddress", office.address);
        form.setValue("senderCity", office.city || "");
        form.setValue("senderState", office.state || "");
        form.setValue("senderPincode", office.pincode || "");
      }
      if (office?.phone && !form.getValues("senderPhone")) {
        form.setValue("senderPhone", office.phone);
      }
    }
    if (worldFirstBooking) {
      if (worldFirstStatus?.product && !form.getValues("partnerProduct")) {
        form.setValue("partnerProduct", worldFirstStatus.product);
      }
      if (worldFirstStatus?.vendor && !form.getValues("partnerVendor")) {
        form.setValue("partnerVendor", worldFirstStatus.vendor);
      }
      if (worldFirstStatus?.service && !form.getValues("partnerService")) {
        form.setValue("partnerService", worldFirstStatus.service);
      }
      if (form.getValues("paymentMode") === "cash") {
        form.setValue("paymentMode", "credit");
      }
      form.setValue("customsDocumentType", "csb4");
      if (!form.getValues("shipmentPurpose") || form.getValues("shipmentPurpose") === "Gift") {
        form.setValue("shipmentPurpose", "UNSOLICITED GIFT - NOT FOR SALE");
      }
      if (!form.getValues("gstInvoice")) {
        form.setValue("gstInvoice", "no");
      }
      if (!form.getValues("senderDocumentType")) {
        form.setValue("senderDocumentType", "GSTIN (Normal)");
      }
    }
    if (office?.gstNumber && !form.getValues("gstin")) {
      form.setValue("gstin", office.gstNumber);
    }
  }, [
    partnerConfirmed,
    selectedPartner,
    delhiveryBooking,
    worldFirstBooking,
    delhiveryStatus,
    worldFirstStatus,
    office,
    form,
  ]);

  const { data: priceQuote, isFetching: isPricing } = useQuery<PricingQuoteResult>({
    queryKey: [
      "booking-price-quote",
      selectedPartnerId,
      serviceType,
      totalWeight,
      senderPincode,
      receiverPincode,
      maxLength,
      maxWidth,
      maxHeight,
    ],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/pricing/quote", {
        courierPartnerId: selectedPartnerId,
        serviceType,
        senderPincode: senderPincode || undefined,
        receiverPincode: receiverPincode || undefined,
        weight: totalWeight.toString(),
        length: maxLength > 0 ? maxLength.toString() : undefined,
        width: maxWidth > 0 ? maxWidth.toString() : undefined,
        height: maxHeight > 0 ? maxHeight.toString() : undefined,
        weightRoundOff: "ceil_kg",
      });
      const data = await res.json();
      if (Array.isArray(data?.quotes) && data.quotes[0]) {
        return data.quotes[0] as PricingQuoteResult;
      }
      return data as PricingQuoteResult;
    },
    enabled: !!selectedPartnerId && totalWeight > 0,
  });

  const calculatePrice = () => {
    if (priceQuote?.sellPrice != null) return priceQuote.sellPrice;
    if (!selectedPartner || totalWeight <= 0) return 0;
    const weightNum = totalWeight;
    const baseRate =
      serviceType === "air"
        ? parseFloat(selectedPartner.baseRateAir || "0")
        : parseFloat(selectedPartner.baseRateSurface || "0");
    const ratePerKg =
      serviceType === "air"
        ? parseFloat(selectedPartner.ratePerKgAir || "0")
        : parseFloat(selectedPartner.ratePerKgSurface || "0");
    return baseRate + weightNum * ratePerKg;
  };

  const updateCalculatedAmount = () => {
    const amount = calculatePrice();
    setCalculatedAmount(amount);
  };

  const changePackageField = (
    id: string,
    field: "weight" | "numberOfPieces" | "length" | "width" | "height",
    value: string,
  ) => {
    if (id === "primary") {
      form.setValue(field, value, { shouldDirty: true, shouldValidate: field === "weight" });
      setTimeout(updateCalculatedAmount, 30);
      return;
    }
    updateExtraPackage(id, field, value);
  };

  const handleSmartFill = async () => {
    if (!smartFillText.trim()) return;
    setIsSmartFilling(true);
    try {
      const res = await apiRequest("POST", "/api/ai/smart-fill", {
        description: smartFillText,
        customers: customers || [],
        partners: partners || [],
      });
      const data = await res.json();
      const fieldKeys: (keyof BookingFormData)[] = [
        "customerId", "courierPartnerId", "awbNumber",
        "senderName", "senderPhone", "senderAddress", "senderCity", "senderState", "senderPincode",
        "receiverName", "receiverPhone", "receiverAddress", "receiverCity", "receiverState", "receiverPincode",
        "weight", "length", "width", "height", "numberOfPieces",
        "contentDescription", "declaredValue", "serviceType", "paymentMode",
      ];
      for (const key of fieldKeys) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          form.setValue(key, data[key] as any, { shouldValidate: true });
        }
      }
      setTimeout(updateCalculatedAmount, 100);
      toast({ title: "Smart Fill Complete", description: "Form fields have been auto-filled by AI." });
    } catch (error: any) {
      toast({ title: "Smart Fill Failed", description: error.message || "Could not parse the description.", variant: "destructive" });
    } finally {
      setIsSmartFilling(false);
    }
  };

  const handlePackagePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const arr = Array.from(files).slice(0, 5);
    setIsScanningPhotos(true);
    try {
      const images: string[] = [];
      for (const f of arr) {
        images.push(await compressImageFileToDataUrl(f));
      }
      const res = await apiRequest("POST", "/api/ai/scan-package-photos", {
        images,
        customers: customers || [],
        partners: partners || [],
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const raw = await res.text();
        throw new Error(
          raw.trimStart().startsWith("<!DOCTYPE") || raw.trimStart().toLowerCase().startsWith("<html")
            ? "Server returned a web page instead of JSON. Restart the dev server (npm run dev) and try again with smaller photos."
            : raw.slice(0, 240) || "Not a JSON response"
        );
      }
      const data = await res.json();
      const fieldKeys: (keyof BookingFormData)[] = [
        "customerId",
        "courierPartnerId",
        "awbNumber",
        "senderName",
        "senderPhone",
        "senderAddress",
        "senderCity",
        "senderState",
        "senderPincode",
        "receiverName",
        "receiverPhone",
        "receiverAddress",
        "receiverCity",
        "receiverState",
        "receiverPincode",
        "weight",
        "length",
        "width",
        "height",
        "numberOfPieces",
        "contentDescription",
        "declaredValue",
        "serviceType",
        "paymentMode",
      ];
      for (const key of fieldKeys) {
        if (data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== "") {
          form.setValue(key, data[key] as never, { shouldValidate: true });
        }
      }
      if (data.customerId) {
        handleCustomerSelect(String(data.customerId));
      }
      setTimeout(updateCalculatedAmount, 100);
      const note = typeof data.scanNotes === "string" && data.scanNotes.trim() ? data.scanNotes.trim() : "Review and submit when ready.";
      toast({
        title: "Photo scan complete",
        description: note,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not read photos.";
      toast({ title: "Photo scan failed", description: message, variant: "destructive" });
    } finally {
      setIsScanningPhotos(false);
      if (scanPhotosInputRef.current) scanPhotosInputRef.current.value = "";
    }
  };

  const handleSectionAiFill = async (section: string) => {
    const text = sectionAiText[section];
    if (!text?.trim()) return;
    setSectionAiLoading(prev => ({ ...prev, [section]: true }));
    try {
      const body: any = { section, description: text };
      if (section === "sender") body.customers = customers || [];
      if (section === "service") body.partners = partners || [];

      const res = await apiRequest("POST", "/api/ai/section-fill", body);
      const data = await res.json();

      const sectionFields: Record<string, string[]> = {
        sender: ["senderName", "senderPhone", "senderAddress", "senderCity", "senderState", "senderPincode", "customerId"],
        receiver: ["receiverName", "receiverPhone", "receiverAddress", "receiverCity", "receiverState", "receiverPincode"],
        package: ["weight", "length", "width", "height", "numberOfPieces", "contentDescription", "declaredValue"],
        service: ["serviceType", "courierPartnerId", "paymentMode", "awbNumber"],
      };

      let filled = 0;
      for (const key of sectionFields[section] || []) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          form.setValue(key as any, String(data[key]), { shouldValidate: true });
          filled++;
        }
      }

      if (section === "sender" && data.customerId) {
        handleCustomerSelect(data.customerId);
      }
      if (section === "package" || section === "service") {
        setTimeout(updateCalculatedAmount, 100);
      }

      toast({ title: "AI Filled", description: `${filled} field(s) auto-filled.` });
      setSectionAiText(prev => ({ ...prev, [section]: "" }));
    } catch (error: any) {
      toast({ title: "AI Error", description: error.message || "Could not process", variant: "destructive" });
    } finally {
      setSectionAiLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleVoiceRecord = async (section: string) => {
    if (recordingSection === section) {
      mediaRecorderRef.current?.stop();
      setRecordingSection(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await apiRequest("POST", "/api/ai/transcribe", { audio: base64 });
            const data = await res.json();
            if (data.text) {
              setSectionAiText(prev => ({ ...prev, [section]: data.text }));
              toast({ title: "Voice captured", description: "Your speech has been transcribed. Press the fill button to apply." });
            }
          } catch (err: any) {
            toast({ title: "Transcription failed", description: err.message || "Could not transcribe audio", variant: "destructive" });
          }
        };
        reader.readAsDataURL(blob);
      };

      setRecordingSection(section);
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setRecordingSection(null);
        }
      }, 15000);
    } catch (err) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice input", variant: "destructive" });
    }
  };

  const handleSmartFillVoice = async () => {
    if (recordingSection === "smartfill") {
      mediaRecorderRef.current?.stop();
      setRecordingSection(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await apiRequest("POST", "/api/ai/transcribe", { audio: base64 });
            const data = await res.json();
            if (data.text) {
              setSmartFillText(data.text);
              toast({ title: "Voice captured", description: "Your speech has been transcribed. Press the fill button to apply." });
            }
          } catch (err: any) {
            toast({ title: "Transcription failed", description: err.message || "Could not transcribe audio", variant: "destructive" });
          }
        };
        reader.readAsDataURL(blob);
      };
      setRecordingSection("smartfill");
      mediaRecorder.start();
      setTimeout(() => { if (mediaRecorder.state === 'recording') { mediaRecorder.stop(); setRecordingSection(null); } }, 15000);
    } catch (err) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice input", variant: "destructive" });
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsMeasuring(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await apiRequest("POST", "/api/ai/measure-package", { imageBase64: base64 });
      const data = await res.json();
      if (data.length) form.setValue("length", String(data.length), { shouldValidate: true });
      if (data.width) form.setValue("width", String(data.width), { shouldValidate: true });
      if (data.height) form.setValue("height", String(data.height), { shouldValidate: true });
      if (data.estimatedWeight) form.setValue("weight", String(data.estimatedWeight), { shouldValidate: true });
      if (data.contentDescription) form.setValue("contentDescription", data.contentDescription, { shouldValidate: true });
      setTimeout(updateCalculatedAmount, 100);
      const confidenceText = data.confidence ? ` (${Math.round(data.confidence * 100)}% confidence)` : "";
      toast({ title: "Package Measured", description: `Dimensions auto-filled from photo.${confidenceText}` });
    } catch (error: any) {
      toast({ title: "Measurement Failed", description: error.message || "Could not measure package from photo.", variant: "destructive" });
    } finally {
      setIsMeasuring(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleAiRecommend = async () => {
    const senderCity = form.getValues("senderCity");
    const receiverCity = form.getValues("receiverCity");
    const currentWeight = form.getValues("weight");
    const currentServiceType = form.getValues("serviceType");
    const contentDescription = form.getValues("contentDescription");

    if (!partners || partners.length === 0) {
      toast({ title: "No Partners", description: "Add courier partners first.", variant: "destructive" });
      return;
    }

    setIsRecommending(true);
    setRecommendation(null);
    try {
      const res = await apiRequest("POST", "/api/ai/recommend-courier", {
        senderCity: senderCity || "",
        receiverCity: receiverCity || "",
        weight: currentWeight || "0",
        serviceType: currentServiceType,
        contentDescription: contentDescription || "",
        partners: partners,
      });
      const data = await res.json();
      setRecommendation(data);
    } catch (error: any) {
      toast({ title: "Recommendation Failed", description: error.message || "Could not get AI recommendation.", variant: "destructive" });
    } finally {
      setIsRecommending(false);
    }
  };

  const acceptRecommendation = (partnerId: string) => {
    form.setValue("courierPartnerId", partnerId, { shouldValidate: true });
    setTimeout(updateCalculatedAmount, 100);
    setRecommendation(null);
    toast({ title: "Partner Selected", description: "Courier partner updated from AI recommendation." });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /** Resize + JPEG compress to stay under JSON limits and speed up vision API. */
  async function compressImageFileToDataUrl(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
    const bitmap = await createImageBitmap(file);
    try {
      let w = bitmap.width;
      let h = bitmap.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", quality);
    } finally {
      bitmap.close();
    }
  }

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const amount = data.manualAmount ? parseFloat(data.manualAmount) : calculatePrice();
      const productRows = filledProducts(data.products);
      const productValue = productsDeclaredValue(productRows);
      const productDesc = productsDescription(productRows);
      const weights = packageWeightSummary({
        actualKg: totalWeight,
        length: maxLength,
        width: maxWidth,
        height: maxHeight,
      });
      const payload = {
        ...data,
        weight: totalWeight.toString(),
        length: maxLength > 0 ? maxLength.toString() : null,
        width: maxWidth > 0 ? maxWidth.toString() : null,
        height: maxHeight > 0 ? maxHeight.toString() : null,
        volumetricWeight: weights.volumetricWeight.toString(),
        chargeableWeight: weights.applicableWeight.toString(),
        numberOfPieces: totalPieces || 1,
        declaredValue:
          totalDeclaredValue > 0
            ? totalDeclaredValue.toString()
            : productValue > 0
              ? productValue.toString()
              : null,
        contentDescription: combinedDescription || productDesc || data.contentDescription || "",
        products: productRows,
        destinationCountry: data.shipmentType === "international" ? data.destinationCountry : null,
        totalAmount: amount.toString(),
        baseAmount: amount.toString(),
        packagePhotoUrls: data.packagePhotoUrls || [],
        packages: packageRows.map((row) => ({
          weight: row.weight || "",
          length: row.length || "",
          width: row.width || "",
          height: row.height || "",
          numberOfPieces: row.numberOfPieces || "1",
          contentDescription: row.contentDescription || "",
          declaredValue: row.declaredValue || "",
        })),
        ...(sourceBookingRequestId ? { bookingRequestId: sourceBookingRequestId } : {}),
      };
      const createRes = await apiRequest("POST", "/api/shipments", payload);
      const shipment = (await createRes.json()) as { id: string };
      const partner = partners?.find((p) => p.id === data.courierPartnerId);
      if (!shouldBookOnCreate(partner, delhiveryStatus, worldFirstStatus)) {
        if (partner && resolveBookingMethod(partner) === "browser_automation") {
          try {
            await apiRequest("POST", `/api/shipments/${shipment.id}/booking/start`);
          } catch {
            // Shipment is saved; operator can open the partner portal from the shipment page.
          }
          return { shipment, autoBook: false as const, openPartner: true as const, job: null };
        }
        return { shipment, autoBook: false as const, openPartner: false as const, job: null };
      }
      try {
        const bookRes = await apiRequest("POST", `/api/shipments/${shipment.id}/booking/start`);
        const snapshot = (await bookRes.json()) as {
          job: { status: string; awbNumber?: string | null; error?: string | null } | null;
        };
        return { shipment, autoBook: true as const, openPartner: false as const, job: snapshot.job };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Courier booking failed";
        return {
          shipment,
          autoBook: true as const,
          openPartner: false as const,
          job: { status: "booking_failed", awbNumber: null, error: message },
        };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
      const { shipment, autoBook, openPartner, job } = result;
      if (openPartner) {
        toast({
          title: `Ready to book in ${selectedPartner?.name || "partner"}`,
          description: "Open the partner portal from this shipment to finish booking and print the AWB.",
        });
        setLocation(`/shipments/${shipment.id}`);
        return;
      }
      if (autoBook && job?.status === "booked") {
        if (worldFirstBooking) {
          toast({
            title: `World First AWB ${job.awbNumber || "created"}`,
            description: "Download Vendor AWB and Invoice from this shipment, then finish Day End if needed.",
          });
          setLocation(`/shipments/${shipment.id}`);
          return;
        }
        toast({
          title: `Booked on ${selectedPartner?.name || "courier"}`,
          description: job.awbNumber
            ? `AWB ${job.awbNumber}. Print the customer bill to hand over.`
            : "Shipment created and booked. Print the customer bill to hand over.",
        });
        setLocation(`/shipments/${shipment.id}/bill?autoprint=1`);
        return;
      }
      if (autoBook) {
        toast({
          title: `Shipment saved — ${selectedPartner?.name || "courier"} booking failed`,
          description: job?.error || "Open the shipment to retry booking.",
          variant: "destructive",
        });
        setLocation(`/shipments/${shipment.id}`);
        return;
      }
      toast({
        title: "Booking Created",
        description: "Print the customer bill to hand over immediately.",
      });
      setLocation(`/shipments/${shipment.id}/bill?autoprint=1`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId);
    if (customer) {
      form.setValue("senderName", customer.name);
      form.setValue("senderPhone", customer.phone);
      form.setValue("senderAddress", customer.address || "");
      form.setValue("senderCity", customer.city || "");
      form.setValue("senderState", customer.state || "");
      form.setValue("senderPincode", customer.pincode || "");
      if (customer.paymentType === "credit") {
        form.setValue("paymentMode", "credit");
      }
    }
  };

  const goToWizardStep = async (next: BookingWizardStepId) => {
    const currentIndex = bookingWizardStepIndex(wizardStep);
    const nextIndex = bookingWizardStepIndex(next);
    if (nextIndex > currentIndex) {
      for (let i = currentIndex; i < nextIndex; i += 1) {
        const stepId = BOOKING_WIZARD_STEPS[i].id;
        const valid = await form.trigger(BOOKING_WIZARD_STEP_FIELDS[stepId], { shouldFocus: true });
        if (!valid) {
          setWizardStep(stepId);
          return false;
        }
      }
    }
    setWizardStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  const goNextStep = async () => {
    const next = BOOKING_WIZARD_STEPS[bookingWizardStepIndex(wizardStep) + 1];
    if (next) await goToWizardStep(next.id);
  };

  const goBackStep = () => {
    const prev = BOOKING_WIZARD_STEPS[bookingWizardStepIndex(wizardStep) - 1];
    if (prev) {
      setWizardStep(prev.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentWizard = BOOKING_WIZARD_STEPS[bookingWizardStepIndex(wizardStep)];
  const manualAmount = form.watch("manualAmount");
  const chargedAmount = (manualAmount ? parseFloat(manualAmount || "0") || 0 : calculatePrice()).toFixed(2);
  const partnerLayout = delhiveryBooking ? "delhivery" : worldFirstBooking ? "world-first" : "generic";
  const partnerBoxRows = packageRows.map((row) => ({
    id: row.id,
    isPrimary: row.isPrimary,
    weight: row.weight,
    length: row.length,
    width: row.width,
    height: row.height,
    numberOfPieces: row.numberOfPieces,
  }));

  if (!partnerConfirmed) {
    return (
      <HubBookingPartnerGate
        partners={partners}
        selectedPartnerId={selectedPartnerId}
        loading={partnersLoading}
        onSelect={(partnerId) => form.setValue("courierPartnerId", partnerId, { shouldValidate: true })}
        onContinue={() => {
          if (!form.getValues("courierPartnerId")) {
            toast({
              title: "Select a courier partner",
              description: "Choose who will move this shipment, then continue.",
              variant: "destructive",
            });
            return;
          }
          setPartnerConfirmed(true);
        }}
        onCancel={() => setLocation(sourceBookingRequestId ? "/bookings" : "/shipments")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(sourceBookingRequestId ? "/bookings" : "/shipments")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">
            {partnerLayout === "delhivery"
              ? "Create New Order"
              : partnerLayout === "world-first"
                ? "AWB Entry"
                : "New Booking"}
          </h1>
          <p className="text-muted-foreground">
            {partnerLayout === "delhivery"
              ? "Delhivery pickup, consignee, order, product, and box details."
              : partnerLayout === "world-first"
                ? "World First shipper, consignee, services, pieces, and performa."
                : `Step ${bookingWizardStepIndex(wizardStep) + 1} of ${BOOKING_WIZARD_STEPS.length}: ${currentWizard.label}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedPartner ? (
            <Badge variant="secondary" className="h-8 gap-1.5 px-3" data-testid="badge-selected-partner">
              <Truck className="h-3.5 w-3.5" />
              {selectedPartner.name} ({selectedPartner.code})
            </Badge>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPartnerConfirmed(false)}
            data-testid="button-change-partner"
          >
            Change partner
          </Button>
        </div>
      </div>

      {partnerLayout === "generic" ? (
        <BookingWizardStepper current={wizardStep} onSelect={(id) => void goToWizardStep(id)} />
      ) : null}

      <Form {...form}>
        <form
          onSubmit={(event) => {
            if (partnerLayout === "generic" && wizardStep !== "charge") {
              event.preventDefault();
              void goNextStep();
              return;
            }
            form.handleSubmit(onSubmit)(event);
          }}
          className="space-y-6"
        >
          {partnerLayout === "delhivery" ? (
            <DelhiveryOrderForm
              form={form}
              branches={branches}
              office={office}
              sellerName={delhiveryStatus?.clientName || office?.name}
              delhiveryPickupLocation={delhiveryStatus?.pickupLocation}
              boxRows={partnerBoxRows}
              onAddBox={addPackageRow}
              onRemoveBox={removePackageRow}
              onChangeBox={changePackageField}
              chargedAmount={chargedAmount}
              isPricing={isPricing}
              submitting={createBookingMutation.isPending}
              submitLabel={`Book in ${selectedPartner?.name || "Delhivery"}`}
              submitPendingLabel={bookOnCreate ? `Booking in ${selectedPartner?.name || "Delhivery"}...` : "Creating..."}
              onRefreshRate={updateCalculatedAmount}
            />
          ) : null}

          {partnerLayout === "world-first" ? (
            <WorldFirstAwbForm
              form={form}
              office={office}
              partner={selectedPartner}
              customers={customers}
              onCustomerSelect={handleCustomerSelect}
              pieceRows={partnerBoxRows}
              onAddPiece={addPackageRow}
              onRemovePiece={removePackageRow}
              onChangePiece={changePackageField}
              maxLength={maxLength}
              maxWidth={maxWidth}
              maxHeight={maxHeight}
              totalWeight={totalWeight}
              submitting={createBookingMutation.isPending}
              submitLabel={`Book in ${selectedPartner?.name || "World First"}`}
              submitPendingLabel={bookOnCreate ? `Booking in ${selectedPartner?.name || "World First"}...` : "Creating..."}
              clientId={worldFirstStatus?.clientId}
            />
          ) : null}

          {partnerLayout === "generic" && wizardStep === "shipment" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Shipment</CardTitle>
                  <p className="text-sm text-muted-foreground">Choose domestic or international, then set pickup and order details.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HubBookingScopeToggle value={shipmentType} onChange={applyShipmentScope} />
                </CardContent>
              </Card>
              <HubBookingOrderSection form={form} branches={branches} scope={shipmentType} />
              <Card className="border-dashed">
                <CardContent className="space-y-2 pt-4">
                  <p className="text-sm font-medium">Quick fill this booking</p>
                  <HubBookingAiBar
                    value={smartFillText}
                    onChange={setSmartFillText}
                    onSubmit={() => void handleSmartFill()}
                    onVoice={() => void handleSmartFillVoice()}
                    loading={isSmartFilling}
                    recording={recordingSection === "smartfill"}
                    testIdPrefix="smart-fill"
                    placeholder='e.g. "Send 5kg parcel from Raj Kumar 9876543210 to Amit Sharma in Delhi by air"'
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}

          {wizardStep === "shipper" ? (
            <HubBookingPartySection
              form={form}
              party="sender"
              scope={shipmentType}
              customers={customers}
              onCustomerSelect={handleCustomerSelect}
              aiText={sectionAiText.sender || ""}
              onAiText={(value) => setSectionAiText((prev) => ({ ...prev, sender: value }))}
              onAiFill={() => void handleSectionAiFill("sender")}
              onVoice={() => void handleVoiceRecord("sender")}
              aiLoading={sectionAiLoading.sender}
              recording={recordingSection === "sender"}
            />
          ) : null}

          {wizardStep === "consignee" ? (
            <HubBookingPartySection
              form={form}
              party="receiver"
              scope={shipmentType}
              aiText={sectionAiText.receiver || ""}
              onAiText={(value) => setSectionAiText((prev) => ({ ...prev, receiver: value }))}
              onAiFill={() => void handleSectionAiFill("receiver")}
              onVoice={() => void handleVoiceRecord("receiver")}
              aiLoading={sectionAiLoading.receiver}
              recording={recordingSection === "receiver"}
            />
          ) : null}

          {wizardStep === "package" ? (
            <div className="space-y-6">
              <Card className="border-dashed border-primary/30 bg-muted/30">
                <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ScanLine className="h-4 w-4 text-[#FF4907]" />
                      <span className="text-sm font-medium">Scan package photos</span>
                    </div>
                    <p className="max-w-xl text-xs text-muted-foreground">
                      Photograph the parcel or label. AI fills sender, receiver, and package fields for you to review.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <input
                      ref={scanPhotosInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePackagePhotoScan}
                      data-testid="input-scan-package-photos"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isScanningPhotos}
                      onClick={() => scanPhotosInputRef.current?.click()}
                      data-testid="button-scan-package-photos"
                    >
                      {isScanningPhotos ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning…
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Choose photos
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Scale className="h-4 w-4" />
                      Package
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Weight, pieces, and dimensions for this shipment.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCameraCapture}
                      data-testid="input-camera-capture"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isMeasuring}
                      data-testid="button-scan-package"
                    >
                      {isMeasuring ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Camera className="mr-1 h-3 w-3" />}
                      Measure from photo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HubBookingAiBar
                    value={sectionAiText.package || ""}
                    onChange={(value) => setSectionAiText((prev) => ({ ...prev, package: value }))}
                    onSubmit={() => void handleSectionAiFill("package")}
                    onVoice={() => void handleVoiceRecord("package")}
                    loading={sectionAiLoading.package}
                    recording={recordingSection === "package"}
                    testIdPrefix="package"
                    placeholder="e.g. 5 kilo electronics, value 10000"
                  />
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          {PACKAGE_COLUMNS.map((key) => (
                            <TableHead key={key}>{PACKAGE_COLUMN_LABELS[key]}</TableHead>
                          ))}
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packageRows.map((pkg, index) => (
                          <TableRow key={pkg.id}>
                            <TableCell>{index + 1}</TableCell>
                            {PACKAGE_COLUMNS.map((key) => (
                              <TableCell key={`${pkg.id}-${key}`}>{renderPackageCell(pkg, index, key, "input-package")}</TableCell>
                            ))}
                            <TableCell>
                              {!pkg.isPrimary && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePackageRow(pkg.id)}
                                  data-testid={`button-remove-package-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Total: {totalWeight.toFixed(2)} kg, {totalPieces} piece(s), Declared Rs. {totalDeclaredValue.toFixed(2)}
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={addPackageRow} data-testid="button-add-package-row">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add package
                    </Button>
                  </div>
                  <PackagePhotoCapture
                    photos={packagePhotos}
                    onChange={(next) => {
                      setPackagePhotos(next);
                      form.setValue("packagePhotoUrls", next, { shouldDirty: true });
                    }}
                  />
                  <HubBookingWeightSummary
                    deadWeight={totalWeight}
                    length={maxLength}
                    width={maxWidth}
                    height={maxHeight}
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}

          {wizardStep === "goods" ? (
            <div className="space-y-6">
              <HubBookingProductSection form={form} scope={shipmentType} partner={selectedPartner} />
              {shipmentType === "international" || worldFirstBooking ? (
                <HubBookingCustomsSection form={form} performa={worldFirstBooking} />
              ) : null}
            </div>
          ) : null}

          {wizardStep === "charge" ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Review</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Courier</p>
                    <p className="font-medium">{selectedPartner ? `${selectedPartner.name} (${selectedPartner.code})` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lane</p>
                    <p className="font-medium">
                      {shipmentType === "international" ? destinationCountry || "International" : "Domestic"} · {senderCity || "Origin"} → {receiverCity || "Destination"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Package</p>
                    <p className="font-medium">{totalWeight.toFixed(2)} kg · {totalPieces} pcs</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium text-[#FF4907]">Rs. {chargedAmount}</p>
                  </div>
                </CardContent>
              </Card>

              <HubBookingCourierApiSection
                form={form}
                partner={selectedPartner}
                delhiveryPickupLocation={delhiveryStatus?.pickupLocation}
              />
              <HubBookingPaymentSection form={form} scope={shipmentType} />

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Truck className="h-4 w-4" />
                    Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HubBookingAiBar
                    value={sectionAiText.service || ""}
                    onChange={(value) => setSectionAiText((prev) => ({ ...prev, service: value }))}
                    onSubmit={() => void handleSectionAiFill("service")}
                    onVoice={() => void handleVoiceRecord("service")}
                    loading={sectionAiLoading.service}
                    recording={recordingSection === "service"}
                    testIdPrefix="service"
                    placeholder="e.g. air express, UPI payment"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service type *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setTimeout(updateCalculatedAmount, 100);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-service-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="surface">Surface (Standard)</SelectItem>
                              <SelectItem value="air">Air (Express)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="awbNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AWB number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Auto-generated or manual entry" data-testid="input-awb" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="border-t pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Bot className="h-4 w-4 text-[#FF4907]" />
                      <span className="text-sm font-medium">AI courier recommendation</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAiRecommend}
                      disabled={isRecommending}
                      data-testid="button-ai-recommend"
                    >
                      {isRecommending ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1 h-3 w-3" />
                          Get recommendation
                        </>
                      )}
                    </Button>
                    {recommendation ? (
                      <div className="mt-3 space-y-2">
                        {(() => {
                          const recommended = partners?.find((p) => p.id === recommendation.recommendedPartnerId);
                          return recommended ? (
                            <div className="space-y-2 rounded-md border p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{recommended.name}</span>
                                  <Badge>Recommended</Badge>
                                </div>
                                <Button type="button" size="sm" onClick={() => acceptRecommendation(recommendation.recommendedPartnerId)} data-testid="button-accept-recommendation">
                                  Accept
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" />
                    Hub collection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="paymentMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment mode *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-mode">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="credit">Credit</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <div>
                      <FormLabel>Calculated amount</FormLabel>
                      <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#FF4907]">
                        {isPricing ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                        Rs. {chargedAmount}
                      </div>
                      {calculatePrice() <= 0 && !manualAmount ? (
                        <p className="mt-1 text-xs text-amber-600">
                          {!selectedPartnerId
                            ? "Select a courier partner to calculate the amount."
                            : totalWeight <= 0
                              ? "Enter package weight to calculate the amount."
                              : "No rate configured for this partner. Enter an override amount."}
                        </p>
                      ) : null}
                      {priceQuote ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Tariff: Rs. {priceQuote.tariffAmount.toFixed(2)} + Margin: Rs. {priceQuote.marginTotal.toFixed(2)}
                          {priceQuote.source === "tariff" ? " · from tariff sheet" : " · fallback rate card"}
                        </p>
                      ) : null}
                    </div>
                    <FormField
                      control={form.control}
                      name="manualAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Override amount</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="Leave blank to use calculated" data-testid="input-manual-amount" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {bookOnCreate ? (
                <p className="text-xs text-muted-foreground">
                  {selectedPartner?.name} API is connected. This creates the XGoo bill and books the AWB in one step.
                </p>
              ) : null}
            </div>
          ) : null}

          {partnerLayout === "generic" ? (
            <BookingWizardFooter
              current={wizardStep}
              submitting={createBookingMutation.isPending}
              submitLabel={`Book in ${selectedPartner?.name || "partner"}`}
              submitPendingLabel={bookOnCreate ? `Booking in ${selectedPartner?.name || "partner"}...` : "Creating..."}
              onBack={goBackStep}
              onNext={() => void goNextStep()}
              onCancel={() => setLocation(sourceBookingRequestId ? "/bookings" : "/shipments")}
            />
          ) : null}
        </form>
      </Form>
    </div>
  );
}

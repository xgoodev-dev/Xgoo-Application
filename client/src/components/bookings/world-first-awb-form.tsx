import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
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
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  emptyHubProduct,
  HUB_CURRENCIES,
  HUB_DESTINATION_COUNTRIES,
  HUB_INCO_TERMS,
  parseNum,
  productLineValue,
} from "@shared/hub-booking";
import { volumetricKg, WORLD_FIRST_DOCUMENT_TYPES, WORLD_FIRST_EXPORT_REASONS } from "@shared/world-first-hsn";
import {
  findWorldFirstMaster,
  servicesForVendor,
  WORLD_FIRST_DESTINATIONS,
  WORLD_FIRST_PRODUCTS,
  WORLD_FIRST_STATIONS,
  WORLD_FIRST_VENDORS,
} from "@shared/world-first-masters";
import type { CourierPartner, Customer, Office } from "@shared/schema";
import { useSidebar } from "@/components/ui/sidebar";
import { ItemDescriptionLookup } from "./item-description-lookup";
import { HubBookingScopeToggle } from "./hub-booking-fields";
import { WorldFirstMasterLookup } from "./world-first-master-lookup";
import { WorldFirstWalletBar } from "./world-first-wallet-bar";
import type { HubBookingFormData } from "./hub-booking-schema";

export type WorldFirstPieceRow = {
  id: string;
  isPrimary: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  numberOfPieces: string;
};

type ChargeRow = {
  id: string;
  description: string;
  amount: string;
  fuelApply: "yes" | "no";
  fuelAmt: string;
  taxApply: "yes" | "no";
  taxOnFuel: string;
  igst: string;
  sgst: string;
  cgst: string;
};

const CHARGE_DESCRIPTIONS = ["Freight", "Fuel Surcharge", "Handling", "ODA", "Other"];

function navyPill(label: string) {
  return (
    <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
      {label}
    </span>
  );
}

function CompactField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

function roundKg(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 1000) / 1000;
}

function filled(value?: string | null) {
  return Boolean((value || "").trim());
}

function phoneReady(value?: string | null) {
  return (value || "").replace(/\D/g, "").length >= 10;
}

export function WorldFirstAwbForm({
  form,
  office,
  partner,
  customers,
  onCustomerSelect,
  pieceRows,
  onAddPiece,
  onRemovePiece,
  onChangePiece,
  totalWeight,
  submitting,
  submitLabel,
  submitPendingLabel,
  clientId,
}: {
  form: UseFormReturn<HubBookingFormData>;
  office: Office | undefined;
  partner?: CourierPartner;
  customers?: Customer[];
  onCustomerSelect?: (customerId: string) => void;
  pieceRows: WorldFirstPieceRow[];
  onAddPiece: () => void;
  onRemovePiece: (id: string) => void;
  onChangePiece: (id: string, field: keyof Omit<WorldFirstPieceRow, "id" | "isPrimary">, value: string) => void;
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
  totalWeight: number;
  submitting?: boolean;
  submitLabel: string;
  submitPendingLabel: string;
  clientId?: string | null;
}) {
  const [openSections, setOpenSections] = useState<string[]>([
    "account",
    "shipper",
    "consignee",
    "services",
    "shipment",
  ]);
  const [bookTime, setBookTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [division, setDivision] = useState("5000");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [charges, setCharges] = useState<ChargeRow[]>([
    {
      id: "freight",
      description: "Freight",
      amount: "",
      fuelApply: "no",
      fuelAmt: "0.00",
      taxApply: "no",
      taxOnFuel: "0.00",
      igst: "0.00",
      sgst: "0.00",
      cgst: "0.00",
    },
  ]);
  const { state: sidebarState, isMobile } = useSidebar();
  const footerLeft = isMobile
    ? "0px"
    : sidebarState === "collapsed"
      ? "var(--sidebar-width-icon)"
      : "var(--sidebar-width)";

  const products = form.watch("products");
  const gstInvoice = form.watch("gstInvoice");
  const contractCharges = parseNum(form.watch("shippingCharges"));
  const otherCharges = parseNum(form.watch("giftwrapCharges"));
  const invoiceNumber = form.watch("invoiceNumber");
  const senderName = form.watch("senderName");
  const senderCity = form.watch("senderCity");
  const receiverCity = form.watch("receiverCity");
  const declaredValue = form.watch("declaredValue");
  const currency = form.watch("currency") || "INR";
  const numberOfPieces = form.watch("numberOfPieces") || "1";
  const weight = form.watch("weight");
  const partnerVendor = form.watch("partnerVendor") || "";
  const partnerService = form.watch("partnerService") || "";
  const vendorServices = useMemo(() => servicesForVendor(partnerVendor), [partnerVendor]);
  const orderDate = form.watch("orderDate");
  const senderAddress = form.watch("senderAddress");
  const senderPhone = form.watch("senderPhone");
  const receiverName = form.watch("receiverName");
  const receiverAddress = form.watch("receiverAddress");
  const receiverPincode = form.watch("receiverPincode");
  const receiverState = form.watch("receiverState");
  const receiverPhone = form.watch("receiverPhone");
  const receiverAlternatePhone = form.watch("receiverAlternatePhone");
  const destinationCountry = form.watch("destinationCountry") || form.watch("receiverCountry");
  const partnerProduct = form.watch("partnerProduct");
  const originCode = form.watch("originCode");
  const paymentMode = form.watch("paymentMode");
  const performaLine = (products || [])[0];

  useEffect(() => {
    if (!partnerService) return;
    if (!vendorServices.some((row) => row.name === partnerService)) {
      form.setValue("partnerService", "");
    }
  }, [form, partnerService, vendorServices]);

  const pieceStats = useMemo(() => {
    const div = parseNum(division) || 5000;
    return pieceRows.map((row) => {
      const pcs = Math.max(1, parseNum(row.numberOfPieces) || 1);
      const actualPc = parseNum(row.weight);
      const vol = roundKg(volumetricKg(parseNum(row.length), parseNum(row.width), parseNum(row.height), pcs, div));
      const actual = roundKg(actualPc * pcs);
      return { ...row, pcs, actualPc, actual, vol, chrg: Math.max(actual, vol) };
    });
  }, [pieceRows, division]);

  const totalActual = pieceStats.reduce((sum, row) => sum + row.actual, 0) || totalWeight;
  const totalVol = pieceStats.reduce((sum, row) => sum + row.vol, 0);
  const chargeWeight = Math.max(totalActual, totalVol);
  const { data: liveRate, isFetching: rateLoading, isError: rateError, error: rateQueryError } = useQuery({
    queryKey: [
      "/api/integrations/world-first/rate",
      originCode,
      senderCity,
      destinationCountry,
      receiverPincode,
      partnerProduct,
      partnerVendor,
      partnerService,
      chargeWeight,
      totalVol,
    ],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/integrations/world-first/rate", {
        originCode,
        originCity: senderCity,
        destinationCountry,
        toPinCode: receiverPincode,
        weightKg: chargeWeight,
        volumetricKg: totalVol,
        product: partnerProduct,
        vendor: partnerVendor,
        service: partnerService,
      });
      return (await res.json()) as {
        quotes: Array<{
          vendor: string;
          service: string;
          product: string;
          grandTotal: number;
          amount: number;
          otherCharges: number;
          fuel: number;
          tax: number;
          displayDays: number | null;
        }>;
      };
    },
    enabled: Boolean(destinationCountry && partnerProduct && partnerVendor && partnerService && chargeWeight > 0),
    staleTime: 60_000,
  });
  const selectedRate = liveRate?.quotes?.[0];
  const canSubmit =
    filled(orderDate) &&
    filled(senderName) &&
    filled(senderCity) &&
    filled(senderAddress) &&
    phoneReady(senderPhone) &&
    filled(receiverName) &&
    filled(receiverAddress) &&
    filled(receiverPincode) &&
    filled(receiverCity) &&
    filled(receiverState) &&
    (phoneReady(receiverPhone) || phoneReady(receiverAlternatePhone)) &&
    filled(destinationCountry) &&
    filled(partnerProduct) &&
    filled(partnerVendor) &&
    filled(partnerService) &&
    filled(paymentMode) &&
    chargeWeight > 0 &&
    filled(performaLine?.name) &&
    filled(performaLine?.hsn);
  const performaTotals = (products || []).reduce(
    (acc, product) => {
      const qty = parseNum(product.units);
      const wt = parseNum(product.weight);
      const amount = productLineValue(product);
      return {
        qty: acc.qty + qty,
        weight: acc.weight + wt,
        amount: acc.amount + amount,
        count: acc.count + ((product.name || "").trim() ? 1 : 0),
      };
    },
    { qty: 0, weight: 0, amount: 0, count: 0 },
  );
  const chargeTotal = contractCharges + otherCharges;
  const filteredCustomers = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    const rows = customers || [];
    if (!q) return rows.slice(0, 12);
    return rows.filter((row) => `${row.name} ${row.phone}`.toLowerCase().includes(q)).slice(0, 12);
  }, [companyQuery, customers]);

  useEffect(() => {
    if (office?.city && !form.getValues("originCode")) {
      const match = findWorldFirstMaster(WORLD_FIRST_STATIONS, office.city);
      if (match) {
        form.setValue("senderCity", match.name);
        form.setValue("originCode", match.code);
      }
    }
    if (!form.getValues("partnerProduct")) {
      form.setValue("partnerProduct", "INTL SAMPLE");
    }
    if (!form.getValues("partnerVendor")) {
      form.setValue("partnerVendor", "WORLD FIRST");
    }
    if (office?.name && !form.getValues("senderName")) {
      form.setValue("senderName", office.name);
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
    if (office?.email && !form.getValues("senderEmail")) {
      form.setValue("senderEmail", office.email);
    }
    if (office?.gstNumber) {
      if (!form.getValues("gstin")) form.setValue("gstin", office.gstNumber);
      if (!form.getValues("senderDocumentNo")) form.setValue("senderDocumentNo", office.gstNumber);
    }
    if (!form.getValues("senderCountry")) {
      form.setValue("senderCountry", "India");
    }
  }, [form, office]);

  useEffect(() => {
    const nextPieces = String(pieceRows.reduce((sum, row) => sum + Math.max(1, parseNum(row.numberOfPieces) || 1), 0) || 1);
    if (form.getValues("numberOfPieces") !== nextPieces) {
      form.setValue("numberOfPieces", nextPieces, { shouldDirty: true });
    }
    const nextWeight = chargeWeight > 0 ? String(chargeWeight) : weight;
    if (nextWeight && form.getValues("weight") !== nextWeight) {
      form.setValue("weight", nextWeight, { shouldDirty: true });
    }
  }, [chargeWeight, form, pieceRows, weight]);

  useEffect(() => {
    if (performaTotals.amount > 0 && !declaredValue) {
      form.setValue("declaredValue", String(performaTotals.amount));
    }
  }, [declaredValue, form, performaTotals.amount]);

  const addPerforma = () => {
    form.setValue("products", [...(form.getValues("products") || []), emptyHubProduct()], { shouldDirty: true });
  };

  const removePerforma = (index: number) => {
    const next = [...(form.getValues("products") || [])];
    if (next.length <= 1) {
      form.setValue("products", [emptyHubProduct()], { shouldDirty: true });
      return;
    }
    next.splice(index, 1);
    form.setValue("products", next, { shouldDirty: true });
  };

  const updateCharge = (id: string, patch: Partial<ChargeRow>) => {
    setCharges((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const inputClass = "h-9";

  return (
    <div>
      <WorldFirstWalletBar className="mb-2" />
      <div className="pb-24">
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="grid gap-3 lg:grid-cols-3">
        <AccordionItem value="account" className="overflow-hidden rounded-xl border bg-card lg:col-span-3">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">{navyPill("Account Details")}</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="mb-4">
              <HubBookingScopeToggle
                value={form.watch("shipmentType")}
                onChange={(scope) => {
                  form.setValue("shipmentType", scope, { shouldValidate: true });
                  if (scope === "domestic") {
                    form.setValue("receiverCountry", "India");
                    form.setValue("destinationCountry", "");
                  }
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Book Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className={inputClass} data-testid="input-wf-book-date" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <CompactField label="Time">
                <Input value={bookTime} className={inputClass} onChange={(event) => setBookTime(event.target.value)} data-testid="input-wf-book-time" />
              </CompactField>
              <CompactField label="Client Name *" className="lg:col-span-1">
                <Input value={senderName || office?.name || ""} className={inputClass} readOnly data-testid="input-wf-client-name" />
              </CompactField>
              <CompactField label="Client ID">
                <Input value={clientId || ""} className={inputClass} readOnly data-testid="input-wf-client-id" />
              </CompactField>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipper" className="overflow-hidden rounded-xl border bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">{navyPill("Shipper Details")}</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <CompactField label="Origin *" className="sm:col-span-2">
                <WorldFirstMasterLookup
                  title="Origin"
                  value={senderCity || ""}
                  codeValue={form.watch("originCode") || ""}
                  rows={WORLD_FIRST_STATIONS}
                  showCode
                  testId="input-wf-origin"
                  onSelect={(row) => {
                    form.setValue("senderCity", row.name, { shouldDirty: true });
                    form.setValue("originCode", row.code, { shouldDirty: true });
                  }}
                />
              </CompactField>
              <CompactField label="Company Name *" className="sm:col-span-2">
                <div className="flex gap-1">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-0">
                        <FormControl>
                          <Input {...field} className={inputClass} data-testid="input-wf-shipper-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Search company">
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-2">
                      <Input
                        value={companyQuery}
                        placeholder="Search customer"
                        className="mb-2 h-8"
                        onChange={(event) => setCompanyQuery(event.target.value)}
                      />
                      <ul className="max-h-56 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <li key={customer.id}>
                            <button
                              type="button"
                              className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                              onClick={() => {
                                onCustomerSelect?.(customer.id);
                                setCompanyOpen(false);
                              }}
                            >
                              <span className="block font-medium">{customer.name}</span>
                              <span className="text-xs text-muted-foreground">{customer.phone}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                </div>
              </CompactField>
              <FormField
                control={form.control}
                name="senderContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-contact" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Address 1</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-address1" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderAddressLine2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-[11px] text-muted-foreground">Address 2</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-address2" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderPincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Pincode</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-pincode" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">City</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-city" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">State</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-state" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderAlternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Telephone</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-tel" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Mobile No.</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">E-Mail</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-email" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Country</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-country" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="iec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">IEC No.</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-shipper-iec" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderDocumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Document Type</FormLabel>
                    <Select value={field.value || "GSTIN (Normal)"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={inputClass} data-testid="select-wf-shipper-doc-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WORLD_FIRST_DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderDocumentNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Document No.</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={inputClass}
                        data-testid="input-wf-shipper-doc-no"
                        onChange={(event) => {
                          field.onChange(event);
                          form.setValue("gstin", event.target.value, { shouldDirty: true });
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="consignee" className="overflow-hidden rounded-xl border bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">{navyPill("Consignee Details")}</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <CompactField label="Destination *" className="sm:col-span-2">
                <WorldFirstMasterLookup
                  title="Destination"
                  value={receiverCity || ""}
                  codeValue={form.watch("destinationCode") || ""}
                  rows={WORLD_FIRST_DESTINATIONS}
                  showCode
                  testId="input-wf-destination"
                  onSelect={(row) => {
                    form.setValue("receiverCity", row.name, { shouldDirty: true });
                    form.setValue("destinationCode", row.code, { shouldDirty: true });
                  }}
                />
              </CompactField>
              <FormField
                control={form.control}
                name="receiverName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-[11px] text-muted-foreground">Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Contact Name</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-contact" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Address 1 *</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-address1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverAddressLine2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-[11px] text-muted-foreground">Address 2</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-address2" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverPincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Pincode *</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-pincode" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">City *</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-city" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">State *</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-state" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverAlternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Telephone *</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-tel" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Mobile No.</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">E-Mail</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-email" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Country</FormLabel>
                    <Select
                      value={field.value || form.watch("receiverCountry") || ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("receiverCountry", value, { shouldDirty: true });
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className={inputClass} data-testid="select-wf-consignee-country">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HUB_DESTINATION_COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <CompactField label="IEC No.">
                <Input className={inputClass} data-testid="input-wf-consignee-iec" />
              </CompactField>
              <FormField
                control={form.control}
                name="receiverDocumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Document Type</FormLabel>
                    <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                      <FormControl>
                        <SelectTrigger className={inputClass} data-testid="select-wf-consignee-doc-type">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Select</SelectItem>
                        {WORLD_FIRST_DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiverDocumentNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Document No.</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-consignee-doc-no" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="services" className="overflow-hidden rounded-xl border bg-card">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">{navyPill("Services Details")}</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-3">
              <CompactField label="Product *">
                <WorldFirstMasterLookup
                  title="Product"
                  value={form.watch("partnerProduct") || ""}
                  rows={WORLD_FIRST_PRODUCTS}
                  testId="input-wf-product"
                  onSelect={(row) => form.setValue("partnerProduct", row.name, { shouldDirty: true })}
                />
              </CompactField>
              <CompactField label="Vendor *">
                <WorldFirstMasterLookup
                  title="Vendor"
                  value={partnerVendor}
                  rows={WORLD_FIRST_VENDORS}
                  testId="input-wf-vendor"
                  onSelect={(row) => {
                    form.setValue("partnerVendor", row.name, { shouldDirty: true });
                    const nextServices = servicesForVendor(row.name);
                    const stillValid = nextServices.some(
                      (service) => service.name === form.getValues("partnerService"),
                    );
                    if (!stillValid) {
                      form.setValue("partnerService", nextServices.length === 1 ? nextServices[0].name : "", {
                        shouldDirty: true,
                      });
                    }
                  }}
                />
              </CompactField>
              <CompactField label="Service *">
                <WorldFirstMasterLookup
                  title={partnerVendor ? `Service (${partnerVendor})` : "Service"}
                  value={partnerService}
                  rows={vendorServices}
                  nameHeader="Service Name"
                  codeHeader="Vendor Code"
                  testId="input-wf-service"
                  disabled={!partnerVendor}
                  disabledHint="Select Vendor first"
                  onSelect={(row) => form.setValue("partnerService", row.name, { shouldDirty: true })}
                />
              </CompactField>
              {destinationCountry && partnerVendor && partnerService ? (
                <div className="rounded-lg border bg-zinc-50 px-3 py-2 text-xs" data-testid="wf-live-rate">
                  {rateLoading ? (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Fetching World First customer rate…
                    </p>
                  ) : rateError ? (
                    <p className="text-destructive">
                      {rateQueryError instanceof Error
                        ? rateQueryError.message
                        : "Could not load World First customer rate."}
                    </p>
                  ) : selectedRate ? (
                    <div className="space-y-1">
                      <p className="font-medium text-zinc-900">
                        Live World First rate · {selectedRate.vendor} · {selectedRate.service}
                      </p>
                      <p className="text-lg font-semibold text-zinc-900">
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
                          selectedRate.grandTotal,
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        {[
                          selectedRate.amount ? `amount ₹${selectedRate.amount.toFixed(2)}` : "",
                          selectedRate.otherCharges ? `other ₹${selectedRate.otherCharges.toFixed(2)}` : "",
                          selectedRate.fuel ? `fuel ₹${selectedRate.fuel.toFixed(2)}` : "",
                          selectedRate.tax ? `tax ₹${selectedRate.tax.toFixed(2)}` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No World First customer rate for this origin, destination, vendor and service.
                    </p>
                  )}
                </div>
              ) : null}
              <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-1">
                <FormField
                  control={form.control}
                  name="declaredValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">Shipment Value</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" className={inputClass} data-testid="input-wf-shipment-value" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">&nbsp;</FormLabel>
                      <Select value={field.value || "INR"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={inputClass} data-testid="select-wf-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HUB_CURRENCIES.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <CompactField label="Pieces *">
                <Input value={numberOfPieces} readOnly className={inputClass} data-testid="input-wf-pieces-summary" />
              </CompactField>
              <CompactField label="Actual Weight *">
                <div className="flex gap-1">
                  <Input value={totalActual ? String(totalActual) : weight || ""} readOnly className={inputClass} />
                  <span className="flex h-9 items-center rounded-md border px-2 text-xs text-muted-foreground">Kgs</span>
                </div>
              </CompactField>
              <div className="grid grid-cols-2 gap-2">
                <CompactField label="Volumetric Weight">
                  <Input value={totalVol ? String(totalVol) : "0"} readOnly className={inputClass} />
                </CompactField>
                <CompactField label="Charge Weight *">
                  <Input value={chargeWeight ? String(chargeWeight) : "0"} readOnly className={inputClass} />
                </CompactField>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch("commercial") === "yes"}
                    onCheckedChange={(checked) => form.setValue("commercial", checked ? "yes" : "no", { shouldDirty: true })}
                  />
                  Commercial
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch("oda") === "yes"}
                    onCheckedChange={(checked) => form.setValue("oda", checked ? "yes" : "no", { shouldDirty: true })}
                  />
                  ODA
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch("medicalCharges") === "yes"}
                    onCheckedChange={(checked) => form.setValue("medicalCharges", checked ? "yes" : "no", { shouldDirty: true })}
                  />
                  Medical Charges
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground">{partner?.name || "World First"} · {currency}</p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pieces" className="overflow-hidden rounded-xl border bg-card lg:col-span-3">
          <AccordionTrigger className="bg-zinc-200 px-4 py-2.5 text-sm font-medium hover:no-underline hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            Click here to enter Pieces details
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-3">
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <CompactField label="Measurement Unit">
                <Input value="Centimeter" readOnly className={cn(inputClass, "w-32")} />
              </CompactField>
              <CompactField label="Actl Weight/PC">
                <Input
                  type="number"
                  className={cn(inputClass, "w-24")}
                  value={pieceRows[0]?.weight || ""}
                  onChange={(event) => onChangePiece(pieceRows[0]?.id, "weight", event.target.value)}
                />
              </CompactField>
              <CompactField label="No. Of Pieces">
                <Input
                  type="number"
                  min="1"
                  className={cn(inputClass, "w-24")}
                  value={pieceRows[0]?.numberOfPieces || "1"}
                  onChange={(event) => onChangePiece(pieceRows[0]?.id, "numberOfPieces", event.target.value)}
                />
              </CompactField>
              <CompactField label="Length">
                <Input type="number" className={cn(inputClass, "w-20")} value={pieceRows[0]?.length || ""} onChange={(event) => onChangePiece(pieceRows[0]?.id, "length", event.target.value)} />
              </CompactField>
              <CompactField label="Width">
                <Input type="number" className={cn(inputClass, "w-20")} value={pieceRows[0]?.width || ""} onChange={(event) => onChangePiece(pieceRows[0]?.id, "width", event.target.value)} />
              </CompactField>
              <CompactField label="Height">
                <Input type="number" className={cn(inputClass, "w-20")} value={pieceRows[0]?.height || ""} onChange={(event) => onChangePiece(pieceRows[0]?.id, "height", event.target.value)} />
              </CompactField>
              <CompactField label="Division">
                <Input value={division} className={cn(inputClass, "w-20")} onChange={(event) => setDivision(event.target.value)} />
              </CompactField>
              <CompactField label="Vol Weight">
                <Input readOnly className={cn(inputClass, "w-24")} value={pieceStats[0]?.vol || 0} />
              </CompactField>
              <CompactField label="Chrg Weight">
                <Input readOnly className={cn(inputClass, "w-24")} value={pieceStats[0]?.chrg || 0} />
              </CompactField>
              <Button type="button" size="sm" className="h-9 bg-slate-800 text-white hover:bg-slate-700" onClick={onAddPiece} data-testid="button-wf-add-piece">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    {["Child AWB", "Actl Weight/PCS", "Pieces", "Length", "Breadth", "Height", "Volumetric Weight", "Charge Weight", "Action"].map((head) => (
                      <th key={head} className="px-3 py-2 text-left text-xs font-semibold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pieceStats.map((row, index) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{index === 0 ? "—" : ""}</td>
                      <td className="px-3 py-2">{row.actualPc || 0}</td>
                      <td className="px-3 py-2">{row.pcs}</td>
                      <td className="px-3 py-2">{row.length || 0}</td>
                      <td className="px-3 py-2">{row.width || 0}</td>
                      <td className="px-3 py-2">{row.height || 0}</td>
                      <td className="px-3 py-2">{row.vol}</td>
                      <td className="px-3 py-2">{row.chrg}</td>
                      <td className="px-3 py-2">
                        {!row.isPrimary ? (
                          <Button type="button" size="icon" variant="ghost" onClick={() => onRemovePiece(row.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="performa" className="overflow-hidden rounded-xl border bg-card lg:col-span-3">
          <AccordionTrigger className="bg-zinc-200 px-4 py-2.5 text-sm font-medium hover:no-underline hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            Click here to enter performa details
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-3">
            <div className="mb-4 rounded-lg border p-3">
              <div className="mb-3">{navyPill("Manifest GST Detail")}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="customsDocumentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">CSB_Type</FormLabel>
                      <Select value={field.value || "csb4"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={inputClass} data-testid="select-wf-csb">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="csb4">CSB 4</SelectItem>
                          <SelectItem value="csb5">CSB 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incoTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">Term Of Invoice</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                        <FormControl>
                          <SelectTrigger className={inputClass} data-testid="select-wf-inco">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Select</SelectItem>
                          {HUB_INCO_TERMS.map((term) => (
                            <SelectItem key={term} value={term}>
                              {term}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <CompactField label="GST Invoice">
                  <div className="flex h-9 overflow-hidden rounded-md border">
                    {(["yes", "no"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={cn(
                          "flex-1 text-sm capitalize",
                          (gstInvoice || "no") === value ? "bg-emerald-600 text-white" : "bg-background",
                        )}
                        onClick={() => form.setValue("gstInvoice", value, { shouldDirty: true })}
                      >
                        {value === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </CompactField>
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">Invoice No</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClass} data-testid="input-wf-invoice-number" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">Invoice Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className={inputClass} data-testid="input-wf-invoice-date" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departmentNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">Department No</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClass} data-testid="input-wf-department" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shipmentPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">Export Reason</FormLabel>
                      <Select value={field.value || WORLD_FIRST_EXPORT_REASONS[0]} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={inputClass} data-testid="select-wf-export-reason">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WORLD_FIRST_EXPORT_REASONS.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] text-muted-foreground">Format</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                        <FormControl>
                          <SelectTrigger className={inputClass} data-testid="select-wf-invoice-format">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Select</SelectItem>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Annexure">Annexure</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {(products || []).map((product, index) => {
              const amount = productLineValue(product);
              const igstAmt = amount * (parseNum(product.taxPercent) / 100);
              return (
                <div key={product.id || index} className="mb-3 flex flex-wrap items-end gap-2">
                  <CompactField label="Box No">
                    <Input
                      className={cn(inputClass, "w-20")}
                      value={product.boxNo || "1"}
                      onChange={(event) => form.setValue(`products.${index}.boxNo`, event.target.value, { shouldDirty: true })}
                    />
                  </CompactField>
                  <CompactField label="Packages">
                    <Input
                      className={cn(inputClass, "w-20")}
                      value={product.packages || product.units || "1"}
                      onChange={(event) => form.setValue(`products.${index}.packages`, event.target.value, { shouldDirty: true })}
                    />
                  </CompactField>
                  <CompactField label="Description" className="min-w-[14rem] flex-1">
                    <ItemDescriptionLookup
                      catalog="world-first"
                      value={product.name || ""}
                      placeholder="Description"
                      testId={`input-wf-performa-desc-${index}`}
                      onChange={(name) => {
                        form.setValue(`products.${index}.name`, name, { shouldDirty: true });
                        form.setValue(`products.${index}.hsn`, "", { shouldDirty: true });
                      }}
                      onSelect={(item) => {
                        form.setValue(`products.${index}.name`, item.name, { shouldDirty: true });
                        form.setValue(`products.${index}.hsn`, item.hsn, { shouldDirty: true });
                        if (!form.getValues("contentDescription")) {
                          form.setValue("contentDescription", item.name, { shouldDirty: true });
                        }
                      }}
                    />
                  </CompactField>
                  <CompactField label="HSN Code">
                    <Input
                      className={cn(inputClass, "w-28 font-mono")}
                      value={product.hsn || ""}
                      onChange={(event) => form.setValue(`products.${index}.hsn`, event.target.value, { shouldDirty: true })}
                      data-testid={`input-wf-performa-hsn-${index}`}
                    />
                  </CompactField>
                  <CompactField label="Quantity">
                    <Input
                      type="number"
                      className={cn(inputClass, "w-20")}
                      value={product.units || "1"}
                      onChange={(event) => form.setValue(`products.${index}.units`, event.target.value, { shouldDirty: true })}
                    />
                  </CompactField>
                  <CompactField label="Weight">
                    <Input
                      type="number"
                      className={cn(inputClass, "w-20")}
                      value={product.weight || ""}
                      onChange={(event) => form.setValue(`products.${index}.weight`, event.target.value, { shouldDirty: true })}
                    />
                  </CompactField>
                  <CompactField label="Unit">
                    <Select
                      value={product.unit || "PCS"}
                      onValueChange={(value) => form.setValue(`products.${index}.unit`, value, { shouldDirty: true })}
                    >
                      <SelectTrigger className={cn(inputClass, "w-20")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PCS">PCS</SelectItem>
                        <SelectItem value="SET">SET</SelectItem>
                        <SelectItem value="KGS">KGS</SelectItem>
                      </SelectContent>
                    </Select>
                  </CompactField>
                  <CompactField label="Rate">
                    <Input
                      type="number"
                      className={cn(inputClass, "w-24")}
                      value={product.unitPrice || ""}
                      onChange={(event) => form.setValue(`products.${index}.unitPrice`, event.target.value, { shouldDirty: true })}
                    />
                  </CompactField>
                  <CompactField label="Amount">
                    <Input readOnly className={cn(inputClass, "w-24")} value={amount ? amount.toFixed(2) : ""} />
                  </CompactField>
                  <CompactField label="IGST %">
                    <Input
                      type="number"
                      className={cn(inputClass, "w-20")}
                      value={product.taxPercent || ""}
                      onChange={(event) => form.setValue(`products.${index}.taxPercent`, event.target.value, { shouldDirty: true })}
                    />
                  </CompactField>
                  <Button type="button" size="sm" className="h-9 bg-slate-800 text-white hover:bg-slate-700" onClick={addPerforma} data-testid="button-wf-add-performa">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add
                  </Button>
                  {index > 0 ? (
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => removePerforma(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <span className="sr-only">{igstAmt}</span>
                </div>
              );
            })}

            <div className="mb-2 flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
              <span>Total Record: {performaTotals.count}</span>
              <span>Quantity: {performaTotals.qty}</span>
              <span>Weight: {performaTotals.weight}</span>
              <span>Amount: {performaTotals.amount.toFixed(2)}</span>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    {["Box No", "Package", "Description", "HS Code", "Quantity", "Weight", "Unit", "Rate", "Amount", "IGST %", "IGST Amount", "Action"].map((head) => (
                      <th key={head} className="px-3 py-2 text-left text-xs font-semibold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(products || [])
                    .filter((product) => (product.name || "").trim())
                    .map((product, index) => {
                      const amount = productLineValue(product);
                      const igstAmt = amount * (parseNum(product.taxPercent) / 100);
                      return (
                        <tr key={product.id || index} className="border-t">
                          <td className="px-3 py-2">{product.boxNo || "1"}</td>
                          <td className="px-3 py-2">{product.packages || product.units || "1"}</td>
                          <td className="px-3 py-2">{product.name}</td>
                          <td className="px-3 py-2 font-mono">{product.hsn}</td>
                          <td className="px-3 py-2">{product.units}</td>
                          <td className="px-3 py-2">{product.weight || 0}</td>
                          <td className="px-3 py-2">{product.unit || "PCS"}</td>
                          <td className="px-3 py-2">{product.unitPrice || 0}</td>
                          <td className="px-3 py-2">{amount.toFixed(2)}</td>
                          <td className="px-3 py-2">{product.taxPercent || 0}</td>
                          <td className="px-3 py-2">{igstAmt.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <Button type="button" size="icon" variant="ghost" onClick={() => removePerforma(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="charges" className="overflow-hidden rounded-xl border bg-card lg:col-span-3">
          <AccordionTrigger className="bg-zinc-200 px-4 py-2.5 text-sm font-medium hover:no-underline hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            Click here to enter Charge details
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-3">
            <div className="mb-3 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
              <FormField
                control={form.control}
                name="shippingCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Contract Charges</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" className={inputClass} data-testid="input-wf-contract-charges" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="giftwrapCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Other Charges</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" className={inputClass} data-testid="input-wf-other-charges" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <CompactField label="Total">
                <Input readOnly className={inputClass} value={chargeTotal.toFixed(2)} />
              </CompactField>
              <CompactField label="Surcharge">
                <Input readOnly className={inputClass} value="0.00" />
              </CompactField>
              <CompactField label="IGST">
                <Input readOnly className={inputClass} value="0.00" />
              </CompactField>
              <CompactField label="CGST">
                <Input readOnly className={inputClass} value="0.00" />
              </CompactField>
              <CompactField label="SGST">
                <Input readOnly className={inputClass} value="0.00" />
              </CompactField>
              <CompactField label="Total Amount">
                <Input readOnly className={inputClass} value={chargeTotal.toFixed(2)} />
              </CompactField>
            </div>
            {charges.map((row) => {
              const itemTotal = parseNum(row.amount) + parseNum(row.fuelAmt) + parseNum(row.igst) + parseNum(row.sgst) + parseNum(row.cgst);
              return (
                <div key={row.id} className="mb-3 flex flex-wrap items-end gap-2">
                  <CompactField label="Description *">
                    <Select value={row.description} onValueChange={(value) => updateCharge(row.id, { description: value })}>
                      <SelectTrigger className={cn(inputClass, "w-40")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHARGE_DESCRIPTIONS.map((desc) => (
                          <SelectItem key={desc} value={desc}>
                            {desc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CompactField>
                  <CompactField label="Item Amount *">
                    <Input
                      type="number"
                      className={cn(inputClass, "w-24")}
                      value={row.amount}
                      onChange={(event) => {
                        updateCharge(row.id, { amount: event.target.value });
                        form.setValue("shippingCharges", event.target.value, { shouldDirty: true });
                      }}
                    />
                  </CompactField>
                  <CompactField label="Item Fuel">
                    <Select value={row.fuelApply} onValueChange={(value: "yes" | "no") => updateCharge(row.id, { fuelApply: value })}>
                      <SelectTrigger className={cn(inputClass, "w-20")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </CompactField>
                  <CompactField label="Tax On Fuel">
                    <Select value={row.taxApply} onValueChange={(value: "yes" | "no") => updateCharge(row.id, { taxApply: value })}>
                      <SelectTrigger className={cn(inputClass, "w-20")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </CompactField>
                  <CompactField label="Tax">
                    <Input
                      className={cn(inputClass, "w-20")}
                      value={row.igst}
                      onChange={(event) => updateCharge(row.id, { igst: event.target.value })}
                    />
                  </CompactField>
                  <CompactField label="Item Total">
                    <Input readOnly className={cn(inputClass, "w-24")} value={itemTotal.toFixed(2)} />
                  </CompactField>
                </div>
              );
            })}
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    {["Description", "Rate", "Amount", "Fuel Apply", "Fuel Amt", "TaxApply", "Tax On Fuel", "IGST", "SGST", "CGST", "Total"].map((head) => (
                      <th key={head} className="px-3 py-2 text-left text-xs font-semibold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {charges.map((row) => {
                    const total = parseNum(row.amount) + parseNum(row.fuelAmt) + parseNum(row.igst) + parseNum(row.sgst) + parseNum(row.cgst);
                    return (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2">{row.description}</td>
                        <td className="px-3 py-2">{row.amount || "0.00"}</td>
                        <td className="px-3 py-2">{row.amount || "0.00"}</td>
                        <td className="px-3 py-2">{row.fuelApply === "yes" ? "Yes" : "No"}</td>
                        <td className="px-3 py-2">{row.fuelAmt}</td>
                        <td className="px-3 py-2">{row.taxApply === "yes" ? "Yes" : "No"}</td>
                        <td className="px-3 py-2">{row.taxOnFuel}</td>
                        <td className="px-3 py-2">{row.igst}</td>
                        <td className="px-3 py-2">{row.sgst}</td>
                        <td className="px-3 py-2">{row.cgst}</td>
                        <td className="px-3 py-2">{total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shipment" className="overflow-hidden rounded-xl border bg-card lg:col-span-3">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">{navyPill("Shipment Details")}</AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Payment Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={inputClass} data-testid="select-wf-payment-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="channelOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Reference No.</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-reference" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contentDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Content</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClass} data-testid="input-wf-content" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipmentInstruction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] text-muted-foreground">Instruction</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-9 resize-none" data-testid="input-wf-instruction" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 rounded-md border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              <span>AWB UserID: {clientId || "—"}</span>
              <span>POD UserID:</span>
              <span>Manifest No: 0</span>
              <span>Invoice No: {invoiceNumber || ""}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      </div>

      <div
        className="fixed bottom-0 right-0 z-40 border-t bg-background px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] md:px-6"
        style={{ left: footerLeft }}
      >
        <div className="flex flex-wrap items-center justify-end gap-3">
          {!canSubmit ? (
            <p className="mr-auto text-xs text-muted-foreground">Fill every required field to enable booking.</p>
          ) : null}
          <Button type="submit" disabled={!canSubmit || submitting} data-testid="button-create-booking">
            {submitting ? submitPendingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

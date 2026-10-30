import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  Box,
  Calculator,
  MapPin,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ItemDescriptionLookup } from "./item-description-lookup";
import type { HubBookingFormData } from "./hub-booking-schema";
import type { BranchWithServiceAreas, Office } from "@shared/schema";

const PACKAGING_TYPES = [
  { value: "cardboard", label: "Cardboard" },
  { value: "flyer", label: "Flyer" },
  { value: "plastic", label: "Plastic" },
  { value: "wooden", label: "Wooden" },
];

export type DelhiveryBoxRow = {
  id: string;
  isPrimary: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  numberOfPieces: string;
};

function kgToGm(kg: string) {
  const n = parseFloat(kg);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n * 1000));
}

function gmToKg(gm: string) {
  const n = parseFloat(gm);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(n / 1000);
}

function applyPickupBranch(
  form: UseFormReturn<HubBookingFormData>,
  branch: BranchWithServiceAreas | undefined,
  office: Office | undefined,
  sellerName?: string | null,
) {
  if (!branch) return;
  form.setValue("pickupLocationName", branch.name, { shouldDirty: true });
  form.setValue("senderAddress", branch.address || office?.address || "", { shouldDirty: true });
  form.setValue("senderCity", branch.city || office?.city || "", { shouldDirty: true });
  form.setValue("senderState", branch.state || office?.state || "", { shouldDirty: true });
  form.setValue("senderPincode", branch.pincode || office?.pincode || "", { shouldDirty: true });
  if (branch.phone) form.setValue("senderPhone", branch.phone, { shouldDirty: true });
  if (branch.email) form.setValue("senderEmail", branch.email, { shouldDirty: true });
  form.setValue("senderName", sellerName || office?.name || branch.name, { shouldDirty: true });
}

export function DelhiveryOrderForm({
  form,
  branches,
  office,
  sellerName,
  delhiveryPickupLocation,
  boxRows,
  onAddBox,
  onRemoveBox,
  onChangeBox,
  chargedAmount,
  isPricing,
  submitting,
  submitLabel,
  submitPendingLabel,
  onRefreshRate,
}: {
  form: UseFormReturn<HubBookingFormData>;
  branches: BranchWithServiceAreas[] | undefined;
  office: Office | undefined;
  sellerName?: string | null;
  delhiveryPickupLocation?: string | null;
  boxRows: DelhiveryBoxRow[];
  onAddBox: () => void;
  onRemoveBox: (id: string) => void;
  onChangeBox: (id: string, field: keyof Omit<DelhiveryBoxRow, "id" | "isPrimary">, value: string) => void;
  chargedAmount: string;
  isPricing?: boolean;
  submitting?: boolean;
  submitLabel: string;
  submitPendingLabel: string;
  onRefreshRate: () => void;
}) {
  const [openSections, setOpenSections] = useState<string[]>(["pickup"]);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupQuery, setPickupQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [billingSame, setBillingSame] = useState(true);

  const pickupName = form.watch("pickupLocationName");
  const senderName = form.watch("senderName");
  const senderAddress = form.watch("senderAddress");
  const senderCity = form.watch("senderCity");
  const senderPincode = form.watch("senderPincode");
  const receiverName = form.watch("receiverName");
  const receiverPhone = form.watch("receiverPhone");
  const receiverEmail = form.watch("receiverEmail");
  const receiverAddress = form.watch("receiverAddress");
  const receiverPincode = form.watch("receiverPincode");
  const receiverCity = form.watch("receiverCity");
  const paymentType = form.watch("orderPaymentType");
  const serviceType = form.watch("serviceType");
  const products = form.watch("products");
  const weight = form.watch("weight");
  const numberOfPieces = form.watch("numberOfPieces");

  const pickupOptions = useMemo(() => {
    const rows: { name: string; address: string; phone?: string; branch?: BranchWithServiceAreas }[] = [];
    const seen = new Set<string>();
    if (delhiveryPickupLocation && !seen.has(delhiveryPickupLocation.toLowerCase())) {
      seen.add(delhiveryPickupLocation.toLowerCase());
      const match = branches?.find((branch) => branch.name.toLowerCase() === delhiveryPickupLocation.toLowerCase());
      rows.push({
        name: delhiveryPickupLocation,
        address: match
          ? [match.address, match.city, match.pincode].filter(Boolean).join(", ")
          : office
            ? [office.address, office.city, office.pincode].filter(Boolean).join(", ")
            : "",
        phone: match?.phone || office?.phone || undefined,
        branch: match,
      });
    }
    for (const branch of branches || []) {
      if (seen.has(branch.name.toLowerCase())) continue;
      seen.add(branch.name.toLowerCase());
      rows.push({
        name: branch.name,
        address: [branch.address, branch.city, branch.pincode].filter(Boolean).join(", "),
        phone: branch.phone || undefined,
        branch,
      });
    }
    const q = pickupQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) => row.name.toLowerCase().includes(q) || row.address.toLowerCase().includes(q),
    );
  }, [branches, delhiveryPickupLocation, office, pickupQuery]);

  const consigneeComplete = Boolean(
    receiverName?.trim() && receiverPhone?.trim() && receiverAddress?.trim() && receiverPincode?.trim(),
  );
  const consigneeLabel = consigneeComplete
    ? `${receiverName} · ${receiverAddress}${receiverPincode ? ` · ${receiverPincode}` : ""}`
    : "";
  const boxCount = boxRows.reduce((sum, row) => sum + Math.max(1, parseInt(row.numberOfPieces || "1", 10) || 1), 0);
  const chargeableKg = boxRows.reduce((sum, row) => sum + (parseFloat(row.weight || "0") || 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="space-y-3">
          <AccordionItem value="pickup" className="overflow-hidden rounded-xl border bg-card">
            <AccordionTrigger className="px-4 hover:no-underline data-[state=open]:bg-amber-50 dark:data-[state=open]:bg-amber-950/20">
              <span className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="h-4 w-4 text-[#FF4907]" />
                Pickup &amp; delivery details
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pickup</Label>
                  <Popover open={pickupOpen} onOpenChange={setPickupOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-left text-sm"
                        data-testid="button-delhivery-pickup"
                      >
                        <span className={cn("flex min-w-0 items-center gap-2", !pickupName && "text-muted-foreground")}>
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className="truncate">{pickupName || "Select Pickup Location"}</span>
                        </span>
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(28rem,var(--radix-popover-trigger-width))] p-2">
                      <Input
                        value={pickupQuery}
                        onChange={(event) => setPickupQuery(event.target.value)}
                        placeholder="Search by facility name or address"
                        className="mb-2"
                        data-testid="input-delhivery-pickup-search"
                      />
                      <ul className="max-h-64 space-y-1 overflow-y-auto">
                        {pickupOptions.map((row) => (
                          <li key={row.name}>
                            <button
                              type="button"
                              className="w-full rounded-md px-2 py-2 text-left hover:bg-accent"
                              onClick={() => {
                                if (row.branch) applyPickupBranch(form, row.branch, office, sellerName);
                                else form.setValue("pickupLocationName", row.name, { shouldDirty: true });
                                setPickupOpen(false);
                              }}
                            >
                              <p className="text-sm font-medium">{row.name}</p>
                              {row.address ? <p className="text-xs text-muted-foreground">{row.address}</p> : null}
                              {row.phone ? <p className="text-xs text-muted-foreground">{row.phone}</p> : null}
                            </button>
                          </li>
                        ))}
                        {pickupOptions.length === 0 ? (
                          <li className="px-2 py-3 text-sm text-muted-foreground">No pickup location matches.</li>
                        ) : null}
                      </ul>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Deliver to</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={consigneeLabel}
                      placeholder="Consignee address"
                      className="bg-muted/40"
                      data-testid="input-delhivery-consignee-summary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setCustomerOpen(true)}
                      data-testid="button-delhivery-add-customer"
                    >
                      {consigneeComplete ? "Edit details" : "Add details +"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  disabled={!consigneeComplete}
                  onClick={() => setOpenSections((prev) => Array.from(new Set([...prev, "order"])))}
                  data-testid="button-delhivery-proceed"
                >
                  Proceed
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="order" className="overflow-hidden rounded-xl border bg-card">
            <AccordionTrigger className="px-4 hover:no-underline data-[state=open]:bg-amber-50 dark:data-[state=open]:bg-amber-950/20">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Package className="h-4 w-4" />
                Order details
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="orderChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select channel</FormLabel>
                      <Select value={field.value || "Default Channel"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-delhivery-channel">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Default Channel">Default Channel</SelectItem>
                          <SelectItem value="XGoo Go">XGoo Go</SelectItem>
                          <SelectItem value="XGoo Pro">XGoo Pro</SelectItem>
                          <SelectItem value="In Store">In Store</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="space-y-1 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Seller detail</p>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold">{senderName || sellerName || office?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {[senderAddress, senderCity, senderPincode].filter(Boolean).join(", ") || "Add pickup location to fill seller address"}
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="channelOrderId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Order ID / reference no.</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter order ID / reference no." data-testid="input-delhivery-order-id" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="product" className="overflow-hidden rounded-xl border bg-card">
            <AccordionTrigger className="px-4 hover:no-underline data-[state=open]:bg-amber-50 dark:data-[state=open]:bg-amber-950/20">
              <span className="flex items-center gap-2 text-base font-semibold">
                <Box className="h-4 w-4" />
                Product &amp; box details
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-5">
              <div className="space-y-2">
                <Label>Product details</Label>
                <ItemDescriptionLookup
                  value={products?.[0]?.name || ""}
                  placeholder="Search by SKU name or code"
                  testId="input-delhivery-sku"
                  onChange={(name) => form.setValue("products.0.name", name, { shouldDirty: true })}
                  onSelect={(item) => {
                    form.setValue("products.0.name", item.name, { shouldDirty: true });
                    form.setValue("products.0.hsn", item.hsn, { shouldDirty: true });
                    form.setValue("contentDescription", item.name, { shouldDirty: true });
                  }}
                />
              </div>
              <FormField
                control={form.control}
                name="orderPaymentType"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Payment mode</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-delhivery-payment-mode">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="prepaid">Prepaid</SelectItem>
                        <SelectItem value="cod">COD</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {paymentType === "cod" ? (
                <FormField
                  control={form.control}
                  name="collectableAmount"
                  render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormLabel>Collectable amount *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="COD amount" data-testid="input-delhivery-cod" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <div className="space-y-3">
                <p className="text-sm font-medium">Box details</p>
                {boxRows.map((row, index) => (
                  <div key={row.id} className="grid items-end gap-2 rounded-md border p-3 sm:grid-cols-[7.5rem_4.5rem_repeat(3,4.5rem)_7rem_auto]">
                    {index === 0 ? (
                      <FormField
                        control={form.control}
                        name="packagingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Packaging type</FormLabel>
                            <Select value={field.value || "cardboard"} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-delhivery-packaging">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PACKAGING_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">Box {index + 1}</div>
                    )}
                    <div className="space-y-2">
                      <Label>No. of boxes</Label>
                      <Input
                        type="number"
                        min="1"
                        value={row.numberOfPieces}
                        onChange={(event) => onChangeBox(row.id, "numberOfPieces", event.target.value)}
                        data-testid={`input-delhivery-boxes-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>L</Label>
                      <Input
                        type="number"
                        value={row.length}
                        onChange={(event) => onChangeBox(row.id, "length", event.target.value)}
                        data-testid={`input-delhivery-l-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>B</Label>
                      <Input
                        type="number"
                        value={row.width}
                        onChange={(event) => onChangeBox(row.id, "width", event.target.value)}
                        data-testid={`input-delhivery-b-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>H</Label>
                      <Input
                        type="number"
                        value={row.height}
                        onChange={(event) => onChangeBox(row.id, "height", event.target.value)}
                        data-testid={`input-delhivery-h-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Package weight</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          placeholder="gm"
                          value={kgToGm(row.weight)}
                          onChange={(event) => onChangeBox(row.id, "weight", gmToKg(event.target.value))}
                          data-testid={`input-delhivery-weight-${index}`}
                        />
                        <span className="flex h-10 items-center rounded-md border px-2 text-xs text-muted-foreground">gm</span>
                      </div>
                    </div>
                    {boxRows.length > 1 ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveBox(row.id)}
                        disabled={row.isPrimary}
                        data-testid={`button-delhivery-remove-box-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={boxRows.length >= 5}
                  onClick={onAddBox}
                  data-testid="button-delhivery-add-box"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add another box size +
                </Button>
                <p className="text-xs text-muted-foreground">A maximum of 5 boxes can be added.</p>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Provide accurate shipment weight and dimensions. Quoted shipping charges are based on this information and can change if the shipment is verified after pickup.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 h-fit">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Truck className="h-4 w-4 text-[#FF4907]" />
            Order Summary
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pickup from</dt>
              <dd className="max-w-[10rem] truncate text-right font-medium">{pickupName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Deliver to</dt>
              <dd className="max-w-[10rem] truncate text-right font-medium">{receiverCity || receiverName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Box / item count</dt>
              <dd className="font-medium">{boxCount || numberOfPieces || 1}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Payment type</dt>
              <dd className="font-medium capitalize">{paymentType}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Chargeable Weight</dt>
              <dd className="font-medium">{chargeableKg > 0 ? `${(chargeableKg * 1000).toFixed(0)} gm` : weight ? `${kgToGm(weight) || "—"} gm` : "—"}</dd>
            </div>
          </dl>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Shipping method</p>
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "surface", label: "Surface", hint: "Standard" },
                    { value: "air", label: "Express", hint: "Air" },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-left text-sm",
                        (serviceType === option.value)
                          ? "border-[#FF4907] ring-1 ring-[#FF4907]"
                          : "border-border",
                      )}
                      data-testid={`button-delhivery-method-${option.value}`}
                    >
                      <span className="block font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.hint}</span>
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-muted-foreground">Estimated amount</p>
            <p className="text-xl font-bold text-[#FF4907]">
              {isPricing ? "…" : `Rs. ${chargedAmount}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={onRefreshRate} data-testid="button-delhivery-rate">
            <Calculator className="mr-2 h-4 w-4" />
            Rate calculator
          </Button>
          <Button type="submit" disabled={submitting} data-testid="button-create-booking">
            {submitting ? submitPendingLabel : submitLabel}
          </Button>
        </div>
      </aside>

      <Sheet open={customerOpen} onOpenChange={setCustomerOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Customer Details</SheetTitle>
            <SheetDescription>Address details used for this Delhivery consignee.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4" />
              Address Details
            </p>
            <FormField
              control={form.control}
              name="receiverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter customer's full name" data-testid="input-delhivery-customer-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="receiverPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact person number</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <span className="flex h-10 items-center rounded-md border px-2 text-sm text-muted-foreground">+91</span>
                        <Input {...field} placeholder="10- digit number" data-testid="input-delhivery-customer-phone" />
                      </div>
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
                    <FormLabel>Email id (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter email id" data-testid="input-delhivery-customer-email" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="receiverAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter address" className="resize-none" data-testid="input-delhivery-customer-address" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">This will be used in the invoices that you will print</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiverPincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter pincode" data-testid="input-delhivery-customer-pin" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiverCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="City" data-testid="input-delhivery-customer-city" />
                  </FormControl>
                </FormItem>
              )}
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={billingSame} onCheckedChange={(value) => setBillingSame(value === true)} />
              Billing address same as delivery address
            </label>
          </div>
          <SheetFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setCustomerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!consigneeComplete}
              onClick={() => setCustomerOpen(false)}
              data-testid="button-delhivery-save-customer"
            >
              Add customer details
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

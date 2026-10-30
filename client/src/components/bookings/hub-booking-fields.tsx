import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { ReactNode } from "react";
import { ArrowLeft, Check, Loader2, Plus, Trash2, Truck } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BOOKING_METHOD_LABELS, resolveBookingMethod } from "@shared/booking-engine";
import { isDelhiveryPartner } from "@shared/delhivery";
import { isWorldFirstPartner } from "@shared/world-first";
import type { CourierPartner } from "@shared/schema";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  emptyHubProduct,
  HUB_CURRENCIES,
  HUB_CUSTOMS_DOCUMENT_TYPES,
  HUB_DESTINATION_COUNTRIES,
  HUB_INCO_TERMS,
  HUB_SHIPMENT_PURPOSES,
  customsDocumentLabel,
  orderPaymentLabel,
  packageWeightSummary,
  productLineValue,
  type HubShipmentScope,
} from "@shared/hub-booking";
import type { BranchWithServiceAreas } from "@shared/schema";
import type { HubBookingFormData } from "./hub-booking-schema";
import { ItemDescriptionLookup } from "./item-description-lookup";

function ScopeFields({
  scope,
  domestic,
  international,
}: {
  scope: HubShipmentScope;
  domestic: ReactNode;
  international: ReactNode;
}) {
  switch (scope) {
    case "domestic":
      return <>{domestic}</>;
    case "international":
      return <>{international}</>;
    default: {
      const exhaustive: never = scope;
      return exhaustive;
    }
  }
}

export function HubBookingPartnerGate({
  partners,
  selectedPartnerId,
  loading,
  onSelect,
  onContinue,
  onCancel,
}: {
  partners: CourierPartner[] | undefined;
  selectedPartnerId: string;
  loading?: boolean;
  onSelect: (partnerId: string) => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const activePartners = (partners || []).filter((partner) => partner.isActive !== false);
  const canContinue = Boolean(selectedPartnerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Booking</h1>
          <p className="text-muted-foreground">Select a courier partner before you fill this booking</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Courier partner</CardTitle>
          <p className="text-sm text-muted-foreground">
            Every new booking starts here. Choose who will move this shipment, then continue to the form.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading courier partners…
            </div>
          ) : activePartners.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Add a courier partner before Hub can book.</p>
              <Button asChild>
                <Link href="/partners" data-testid="link-add-partners">
                  Open Partners
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {activePartners.map((partner) => {
                const selected = partner.id === selectedPartnerId;
                const method = resolveBookingMethod(partner);
                return (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => onSelect(partner.id)}
                    onDoubleClick={() => {
                      onSelect(partner.id);
                      onContinue();
                    }}
                    data-testid={`button-select-partner-${partner.code}`}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{partner.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{partner.code}</p>
                      </div>
                      {selected ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <Badge variant="secondary" className="mt-3 text-[10px]">
                      {BOOKING_METHOD_LABELS[method]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-partner-gate">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canContinue}
              onClick={onContinue}
              data-testid="button-continue-booking"
            >
              Continue to booking
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HubBookingScopeToggle({
  value,
  onChange,
}: {
  value: HubShipmentScope;
  onChange: (scope: HubShipmentScope) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted p-1" role="tablist" aria-label="Domestic or international">
      <button
        type="button"
        role="tab"
        aria-selected={value === "domestic"}
        className={`rounded-md px-4 py-1.5 text-sm font-medium ${
          value === "domestic" ? "bg-white text-[#FF4907] shadow-sm" : "text-muted-foreground"
        }`}
        onClick={() => onChange("domestic")}
        data-testid="tab-booking-domestic"
      >
        Domestic
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "international"}
        className={`rounded-md px-4 py-1.5 text-sm font-medium ${
          value === "international" ? "bg-white text-[#FF4907] shadow-sm" : "text-muted-foreground"
        }`}
        onClick={() => onChange("international")}
        data-testid="tab-booking-international"
      >
        International
      </button>
    </div>
  );
}

export function HubBookingOrderSection({
  form,
  branches,
  scope,
}: {
  form: UseFormReturn<HubBookingFormData>;
  branches: BranchWithServiceAreas[] | undefined;
  scope: HubShipmentScope;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Pickup and order</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="pickupLocationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pickup location</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  const branch = branches?.find((row) => row.name === value);
                  if (!branch) return;
                  if (!form.getValues("senderAddress")) form.setValue("senderAddress", branch.address || "");
                  if (!form.getValues("senderCity")) form.setValue("senderCity", branch.city || "");
                  if (!form.getValues("senderState")) form.setValue("senderState", branch.state || "");
                  if (!form.getValues("senderPincode")) form.setValue("senderPincode", branch.pincode || "");
                  if (!form.getValues("senderPhone") && branch.phone) form.setValue("senderPhone", branch.phone);
                  if (!form.getValues("senderEmail") && branch.email) form.setValue("senderEmail", branch.email);
                }}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-pickup-location">
                    <SelectValue placeholder="Select Hub pickup location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                      {branch.isPrimary ? " (Primary)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="channelOrderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional channel / store order ID" data-testid="input-channel-order-id" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orderDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order date</FormLabel>
              <FormControl>
                <Input {...field} type="date" data-testid="input-order-date" />
              </FormControl>
            </FormItem>
          )}
        />
        <ScopeFields
          scope={scope}
          domestic={null}
          international={
            <FormField
              control={form.control}
              name="destinationCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination country *</FormLabel>
                  <Select value={field.value || ""} onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("receiverCountry", value);
                  }}>
                    <FormControl>
                      <SelectTrigger data-testid="select-destination-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {HUB_DESTINATION_COUNTRIES.filter((country) => country !== "India").map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          }
        />
      </CardContent>
    </Card>
  );
}

export function HubBookingAddressExtras({
  form,
  party,
  scope,
}: {
  form: UseFormReturn<HubBookingFormData>;
  party: "sender" | "receiver";
  scope: HubShipmentScope;
}) {
  const names = (() => {
    switch (party) {
      case "sender":
        return {
          email: "senderEmail",
          alternatePhone: "senderAlternatePhone",
          addressLine2: "senderAddressLine2",
          landmark: "senderLandmark",
          country: "senderCountry",
        } as const;
      case "receiver":
        return {
          email: "receiverEmail",
          alternatePhone: "receiverAlternatePhone",
          addressLine2: "receiverAddressLine2",
          landmark: "receiverLandmark",
          country: "receiverCountry",
        } as const;
      default: {
        const exhaustive: never = party;
        return exhaustive;
      }
    }
  })();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name={names.email}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="name@email.com" data-testid={`input-${party}-email`} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={names.alternatePhone}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alternate phone</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Optional" data-testid={`input-${party}-alternate-phone`} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={names.addressLine2}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address line 2</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Apartment, floor, suite" data-testid={`input-${party}-address-line2`} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={names.landmark}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Landmark</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Near landmark" data-testid={`input-${party}-landmark`} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={names.country}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <Select
              value={field.value || (scope === "domestic" ? "India" : "")}
              onValueChange={field.onChange}
              disabled={scope === "domestic"}
            >
              <FormControl>
                <SelectTrigger data-testid={`select-${party}-country`}>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {HUB_DESTINATION_COUNTRIES.map((country) => (
                  <SelectItem key={`${party}-${country}`} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}

export function HubBookingCourierApiSection({
  form,
  partner,
  delhiveryPickupLocation,
}: {
  form: UseFormReturn<HubBookingFormData>;
  partner?: CourierPartner;
  delhiveryPickupLocation?: string | null;
}) {
  if (!partner) return null;
  const worldFirst = isWorldFirstPartner(partner.code, partner.name);
  const delhivery = isDelhiveryPartner(partner.code, partner.name);
  if (!worldFirst && !delhivery) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{partner.name} booking fields</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        {worldFirst ? (
          <>
            <FormField
              control={form.control}
              name="partnerProduct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Same as Xpresion Product" data-testid="input-wf-product" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partnerVendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Same as Xpresion Vendor" data-testid="input-wf-vendor" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partnerService"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Same as Xpresion Service" data-testid="input-wf-service" />
                  </FormControl>
                </FormItem>
              )}
            />
            <p className="sm:col-span-3 text-sm text-muted-foreground">
              Use the Product, Vendor and Service names exactly as they appear on World First AWB
              Entry. Leave blank to use values from .env.
            </p>
          </>
        ) : null}
        {delhivery ? (
          <>
            <FormField
              control={form.control}
              name="gstin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seller GSTIN</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="15-character GSTIN" data-testid="input-delhivery-gstin" />
                  </FormControl>
                </FormItem>
              )}
            />
            <p className="sm:col-span-3 text-sm text-muted-foreground">
              Pickup location must match the Delhivery One warehouse name
              {delhiveryPickupLocation ? ` (${delhiveryPickupLocation})` : ""}. Prepaid vs COD uses
              Order payment above. Add HSN on each product line (defaults to 999799).
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function HubBookingProductSection({
  form,
  scope,
  partner,
}: {
  form: UseFormReturn<HubBookingFormData>;
  scope: HubShipmentScope;
  partner?: CourierPartner;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  });
  const worldFirst = isWorldFirstPartner(partner?.code, partner?.name);
  const hsnRequired =
    scope === "international" ||
    worldFirst ||
    isDelhiveryPartner(partner?.code, partner?.name);
  const products = form.watch("products");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <div>
          <CardTitle className="text-base">{worldFirst ? "Performa details" : "Product details"}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Type a description to see matching items. Selecting one fills the HSN code.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(emptyHubProduct())}
          data-testid="button-add-product"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {worldFirst ? "Add" : "Add product"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{worldFirst ? "Description" : "Name"}</TableHead>
                {worldFirst ? null : <TableHead>SKU</TableHead>}
                <TableHead>{hsnRequired ? "HSN *" : "HSN"}</TableHead>
                <TableHead>{worldFirst ? "Quantity" : "Qty"}</TableHead>
                <TableHead>{worldFirst ? "Rate" : "Unit price"}</TableHead>
                {worldFirst ? null : <TableHead>Discount</TableHead>}
                {worldFirst ? null : <TableHead>Tax %</TableHead>}
                <TableHead>Weight (kg)</TableHead>
                {worldFirst ? <TableHead>Amount</TableHead> : null}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="min-w-[220px]">
                    <ItemDescriptionLookup
                      value={products?.[index]?.name || ""}
                      placeholder={worldFirst ? "Package description" : "Product name"}
                      testId={`input-product-name-${index}`}
                      onChange={(name) =>
                        form.setValue(`products.${index}.name`, name, { shouldDirty: true })
                      }
                      onSelect={(item) => {
                        form.setValue(`products.${index}.name`, item.name, { shouldDirty: true });
                        form.setValue(`products.${index}.hsn`, item.hsn, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  </TableCell>
                  {worldFirst ? null : (
                    <TableCell className="min-w-[110px]">
                      <Input {...form.register(`products.${index}.sku`)} placeholder="SKU" data-testid={`input-product-sku-${index}`} />
                    </TableCell>
                  )}
                  <TableCell className="min-w-[110px]">
                    <Input {...form.register(`products.${index}.hsn`)} placeholder="HSN" data-testid={`input-product-hsn-${index}`} />
                  </TableCell>
                  <TableCell className="w-[80px]">
                    <Input {...form.register(`products.${index}.units`)} type="number" min="1" data-testid={`input-product-qty-${index}`} />
                  </TableCell>
                  <TableCell className="w-[110px]">
                    <Input {...form.register(`products.${index}.unitPrice`)} type="number" placeholder="0" data-testid={`input-product-price-${index}`} />
                  </TableCell>
                  {worldFirst ? null : (
                    <TableCell className="w-[100px]">
                      <Input {...form.register(`products.${index}.discount`)} type="number" placeholder="0" data-testid={`input-product-discount-${index}`} />
                    </TableCell>
                  )}
                  {worldFirst ? null : (
                    <TableCell className="w-[80px]">
                      <Input {...form.register(`products.${index}.taxPercent`)} type="number" placeholder="0" data-testid={`input-product-tax-${index}`} />
                    </TableCell>
                  )}
                  <TableCell className="w-[100px]">
                    <Input {...form.register(`products.${index}.weight`)} type="number" placeholder="0" data-testid={`input-product-weight-${index}`} />
                  </TableCell>
                  {worldFirst ? (
                    <TableCell className="w-[100px] font-medium tabular-nums">
                      {productLineValue(products?.[index] || emptyHubProduct()).toFixed(2)}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        data-testid={`button-remove-product-${index}`}
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
        <p className="text-sm text-muted-foreground">
          Product value Rs.{" "}
          {(products || []).reduce((sum, product) => sum + productLineValue(product), 0).toFixed(2)}
          {hsnRequired
            ? worldFirst
              ? " · Select an item to fill HSN automatically."
              : scope === "international"
                ? " · HSN is required on international product lines."
                : " · HSN is required for Delhivery (defaults to 999799 if left blank)."
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}

export function HubBookingPaymentSection({
  form,
  scope,
}: {
  form: UseFormReturn<HubBookingFormData>;
  scope: HubShipmentScope;
}) {
  const paymentType = form.watch("orderPaymentType");

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Payment details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="orderPaymentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order payment</FormLabel>
              <FormControl>
                <RadioGroup
                  className="flex gap-4"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  {(["prepaid", "cod"] as const).map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={type} data-testid={`radio-order-payment-${type}`} />
                      {orderPaymentLabel(type)}
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ScopeFields
          scope={scope}
          domestic={
            paymentType === "cod" ? (
              <FormField
                control={form.control}
                name="collectableAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collectable amount *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="COD amount" data-testid="input-collectable-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null
          }
          international={
            paymentType === "cod" ? (
              <p className="text-sm text-amber-700">
                International COD is limited. Confirm the partner accepts COD before booking.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">International bookings are typically prepaid.</p>
            )
          }
        />
        {scope === "international" && paymentType === "cod" ? (
          <FormField
            control={form.control}
            name="collectableAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collectable amount *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="COD amount" data-testid="input-collectable-amount-intl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="shippingCharges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping charges</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" data-testid="input-shipping-charges" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="giftwrapCharges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giftwrap charges</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" data-testid="input-giftwrap-charges" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transactionCharges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction charges</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" data-testid="input-transaction-charges" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="resellerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reseller name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional" data-testid="input-reseller-name" />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function HubBookingWeightSummary({
  deadWeight,
  length,
  width,
  height,
}: {
  deadWeight: number;
  length: number;
  width: number;
  height: number;
}) {
  const summary = packageWeightSummary({ actualKg: deadWeight, length, width, height });
  return (
    <div className="grid gap-3 sm:grid-cols-3 rounded-md border bg-muted/40 p-3 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">Dead weight</p>
        <p className="font-medium">{summary.deadWeight.toFixed(2)} kg</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Volumetric weight (L×B×H÷5000)</p>
        <p className="font-medium">{summary.volumetricWeight.toFixed(2)} kg</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Applicable weight</p>
        <p className="font-medium">{summary.applicableWeight.toFixed(2)} kg</p>
      </div>
    </div>
  );
}

export function HubBookingCustomsSection({
  form,
  performa,
}: {
  form: UseFormReturn<HubBookingFormData>;
  performa?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{performa ? "Manifest GST / Performa" : "Customs & invoice"}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="customsDocumentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{performa ? "CSB type" : "Customs document"}</FormLabel>
              <Select value={field.value || "csb5"} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-customs-document">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HUB_CUSTOMS_DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {customsDocumentLabel(type)}
                    </SelectItem>
                  ))}
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
              <FormLabel>Inco terms</FormLabel>
              <Select value={field.value || "DAP"} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-inco-terms">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
        <FormField
          control={form.control}
          name="shipmentPurpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{performa ? "Export reason" : "Purpose of shipment"}</FormLabel>
              <Select value={field.value || "Gift"} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-shipment-purpose">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HUB_SHIPMENT_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {purpose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice currency</FormLabel>
              <Select value={field.value || "INR"} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger data-testid="select-currency">
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
        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional" data-testid="input-invoice-number" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invoiceDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice date</FormLabel>
              <FormControl>
                <Input {...field} type="date" data-testid="input-invoice-date" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gstin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GSTIN</FormLabel>
              <FormControl>
                <Input {...field} placeholder="15-character GSTIN" data-testid="input-gstin" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="iec"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IEC</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Importer Exporter Code" data-testid="input-iec" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ioss"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IOSS</FormLabel>
              <FormControl>
                <Input {...field} placeholder="EU IOSS, if applicable" data-testid="input-ioss" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="eori"
          render={({ field }) => (
            <FormItem>
              <FormLabel>EORI</FormLabel>
              <FormControl>
                <Input {...field} placeholder="EORI, if applicable" data-testid="input-eori" />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}


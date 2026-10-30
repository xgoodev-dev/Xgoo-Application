import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ChevronDown, MapPin, User } from "lucide-react";
import { AddressMapField } from "@/components/bookings/AddressMapField";
import { HubBookingAddressExtras } from "@/components/bookings/hub-booking-fields";
import { HubBookingAiBar } from "@/components/bookings/hub-booking-ai-bar";
import type { HubBookingFormData } from "@/components/bookings/hub-booking-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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
import type { Customer } from "@shared/schema";
import type { HubShipmentScope } from "@shared/hub-booking";

export function HubBookingPartySection({
  form,
  party,
  scope,
  customers,
  onCustomerSelect,
  aiText,
  onAiText,
  onAiFill,
  onVoice,
  aiLoading,
  recording,
}: {
  form: UseFormReturn<HubBookingFormData>;
  party: "sender" | "receiver";
  scope: HubShipmentScope;
  customers?: Customer[];
  onCustomerSelect?: (customerId: string) => void;
  aiText: string;
  onAiText: (value: string) => void;
  onAiFill: () => void;
  onVoice: () => void;
  aiLoading?: boolean;
  recording?: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isShipper = party === "sender";
  const names = isShipper
    ? {
        name: "senderName",
        phone: "senderPhone",
        address: "senderAddress",
        city: "senderCity",
        state: "senderState",
        pincode: "senderPincode",
      } as const
    : {
        name: "receiverName",
        phone: "receiverPhone",
        address: "receiverAddress",
        city: "receiverCity",
        state: "receiverState",
        pincode: "receiverPincode",
      } as const;
  const postalLabel = scope === "international" ? "Postal code" : "Pincode";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isShipper ? <User className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
          {isShipper ? "Shipper" : "Consignee"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isShipper ? "Who is sending this shipment." : "Where this shipment should be delivered."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <HubBookingAiBar
          value={aiText}
          onChange={onAiText}
          onSubmit={onAiFill}
          onVoice={onVoice}
          loading={aiLoading}
          recording={recording}
          testIdPrefix={party}
          placeholder={
            isShipper
              ? "e.g. Raj Kumar, 9876543210, MG Road Bangalore"
              : "e.g. Amit Sharma, Delhi 110001"
          }
        />
        {isShipper && onCustomerSelect ? (
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saved customer</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    onCustomerSelect(value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Walk-in customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={names.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={`${isShipper ? "Sender" : "Receiver"} name`} data-testid={`input-${isShipper ? "sender" : "receiver"}-name`} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={names.phone}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="10-digit phone" data-testid={`input-${isShipper ? "sender" : "receiver"}-phone`} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name={names.address}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Full address" className="resize-none" data-testid={`input-${isShipper ? "sender" : "receiver"}-address`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <AddressMapField
          label={`Pin ${isShipper ? "sender" : "receiver"} on map`}
          testIdPrefix={isShipper ? "sender" : "receiver"}
          value={{
            address: form.watch(names.address) || "",
            city: form.watch(names.city),
            state: form.watch(names.state),
            pincode: form.watch(names.pincode),
          }}
          onChange={(next) => {
            if (next.address) form.setValue(names.address, next.address, { shouldDirty: true });
            if (next.city) form.setValue(names.city, next.city, { shouldDirty: true });
            if (next.state) form.setValue(names.state, next.state, { shouldDirty: true });
            if (next.pincode) form.setValue(names.pincode, next.pincode, { shouldDirty: true });
          }}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name={names.city}
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="City" data-testid={`input-${isShipper ? "sender" : "receiver"}-city`} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={names.state}
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="State" data-testid={`input-${isShipper ? "sender" : "receiver"}-state`} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={names.pincode}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{postalLabel}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={postalLabel} data-testid={`input-${isShipper ? "sender" : "receiver"}-pincode`} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="px-0" data-testid={`button-${isShipper ? "sender" : "receiver"}-more`}>
              <ChevronDown className={`mr-1 h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              {moreOpen ? "Hide extra details" : "Email, landmark, and extra address"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <HubBookingAddressExtras form={form} party={party} scope={scope} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

import type { UseFormReturn } from "react-hook-form";
import { Loader2, Printer } from "lucide-react";
import { PackagePhotoCapture } from "@/components/bookings/PackagePhotoCapture";
import { HubBookingPartySection } from "@/components/bookings/hub-booking-party-section";
import type { HubBookingFormData } from "@/components/bookings/hub-booking-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function PaperShipperBookingForm({
  form,
  partnerName,
  tirupati,
  photos,
  onPhotosChange,
  chargedAmount,
  submitting,
  customers,
  onCustomerSelect,
  onPrintAft,
  printingLabel,
  senderAi,
  receiverAi,
}: {
  form: UseFormReturn<HubBookingFormData>;
  partnerName: string;
  tirupati?: boolean;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  chargedAmount: string;
  submitting?: boolean;
  customers?: Customer[];
  onCustomerSelect: (customerId: string) => void;
  onPrintAft: () => void | Promise<void>;
  printingLabel?: boolean;
  senderAi: {
    text: string;
    onText: (value: string) => void;
    onFill: () => void;
    onVoice: () => void;
    loading?: boolean;
    recording?: boolean;
  };
  receiverAi: {
    text: string;
    onText: (value: string) => void;
    onFill: () => void;
    onVoice: () => void;
    loading?: boolean;
    recording?: boolean;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <HubBookingPartySection
          form={form}
          party="sender"
          scope="domestic"
          compact
          customers={customers}
          onCustomerSelect={onCustomerSelect}
          aiText={senderAi.text}
          onAiText={senderAi.onText}
          onAiFill={senderAi.onFill}
          onVoice={senderAi.onVoice}
          aiLoading={senderAi.loading}
          recording={senderAi.recording}
          title="From (Consigner)"
          hint="Pickup from Go, Pro, or the store QR."
        />
        <HubBookingPartySection
          form={form}
          party="receiver"
          scope="domestic"
          compact
          aiText={receiverAi.text}
          onAiText={receiverAi.onText}
          onAiFill={receiverAi.onFill}
          onVoice={receiverAi.onVoice}
          aiLoading={receiverAi.loading}
          recording={receiverAi.recording}
          title="To (Consignee)"
          hint="Delivery details for the parcel label."
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="contentDescription"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Item description *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} placeholder="What is inside the parcel" data-testid="input-paper-items" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="declaredValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item value *</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Declared value" data-testid="input-paper-item-value" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg) *</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" placeholder="0.50" data-testid="input-paper-weight" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfPieces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pieces</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} data-testid="input-paper-pieces" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-paper-service">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="surface">Surface</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Parcel photos {tirupati ? "" : "*"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {tirupati
                ? "Optional photos kept on the XGoo booking."
                : `Invoice copy and goods photo for ${partnerName}.`}
            </p>
            <PackagePhotoCapture compact photos={photos} onChange={onPhotosChange} />
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipper & charge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="awbNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipper AWB *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Printed AWB" data-testid="input-paper-awb" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="manualAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Without tax *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="0.00" data-testid="input-paper-amount-ex-tax" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax (GST)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="0.00" data-testid="input-paper-gst" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Amount with tax</p>
              <p className="text-2xl font-bold text-[#FF4907]">Rs. {chargedAmount}</p>
            </div>
            <FormField
              control={form.control}
              name="paymentMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-paper-payment">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">QR</SelectItem>
                      <SelectItem value="bank_transfer">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => void onPrintAft()}
                disabled={printingLabel}
                data-testid="button-print-aft"
              >
                {printingLabel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Print label
              </Button>
              <Button type="submit" disabled={submitting} data-testid="button-create-booking">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tirupati ? "Saving..." : `Updating ${partnerName}...`}
                  </>
                ) : (
                  "Book Shipment"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                {tirupati
                  ? "Saves this booking in XGoo only."
                  : `Saves in XGoo and updates the ${partnerName} portal.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

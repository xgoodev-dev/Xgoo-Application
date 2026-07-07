import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Plus, Trash2, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import type { CustomerAddress } from "@shared/schema";

const addressFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  addressType: z.enum(["sender", "receiver"]),
});

export interface SavedAddressValue {
  name: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: string | null;
  lng?: string | null;
}

export function AddressPicker({
  token,
  addressType,
  onSelect,
}: {
  token: string;
  addressType: "sender" | "receiver";
  onSelect: (address: SavedAddressValue) => void;
}) {
  const { data: addresses = [] } = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customer/addresses"],
    queryFn: async () => {
      const res = await fetch("/api/customer/addresses", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filtered = addresses.filter((a) => a.addressType === addressType);
  if (filtered.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="text-xs text-muted-foreground w-full">Saved addresses:</span>
      {filtered.map((addr) => (
        <Button
          key={addr.id}
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() =>
            onSelect({
              name: addr.name,
              phone: addr.phone,
              address: addr.address,
              city: addr.city || undefined,
              state: addr.state || undefined,
              pincode: addr.pincode || undefined,
              lat: addr.lat,
              lng: addr.lng,
            })
          }
        >
          <MapPin className="h-3 w-3 mr-1" />
          {addr.label}
          {addr.isDefault && <Star className="h-3 w-3 ml-1 fill-amber-400 text-amber-400" />}
        </Button>
      ))}
    </div>
  );
}

export function SavedAddressesManager({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: addresses = [], isLoading } = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customer/addresses"],
    queryFn: async () => {
      const res = await fetch("/api/customer/addresses", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) throw new Error("Failed to load addresses");
      return res.json();
    },
  });

  const form = useForm<z.infer<typeof addressFormSchema>>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: "",
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      addressType: "sender",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addressFormSchema>) => {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-customer-token": token },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/addresses"] });
      form.reset();
      setShowForm(false);
      toast({ title: "Address saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "DELETE",
        headers: { "x-customer-token": token },
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/addresses"] });
      toast({ title: "Address removed" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-customer-token": token },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/addresses"] });
      toast({ title: "Default address updated" });
    },
  });

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Saved Addresses
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved addresses yet. Add one for faster booking.</p>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{addr.label}</span>
                    <Badge variant="secondary" className="text-xs capitalize">{addr.addressType}</Badge>
                    {addr.isDefault && (
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{addr.name} · {addr.phone}</p>
                  <p className="text-xs text-muted-foreground truncate">{addr.address}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!addr.isDefault && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDefaultMutation.mutate(addr.id)}>
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(addr.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-3 border-t pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField control={form.control} name="label" render={({ field }) => (
                  <FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} placeholder="Home, Office..." /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="addressType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="sender">Pickup (Sender)</SelectItem>
                        <SelectItem value="receiver">Delivery (Receiver)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} className="resize-none" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-3 grid-cols-3">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Address
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

export async function saveAddressFromBooking(
  token: string,
  data: {
    label: string;
    name: string;
    phone: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    lat?: string | null;
    lng?: string | null;
    addressType: "sender" | "receiver";
  }
) {
  await fetch("/api/customer/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-customer-token": token },
    body: JSON.stringify({ ...data, isDefault: false }),
  });
}

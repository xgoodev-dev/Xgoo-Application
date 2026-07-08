import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package,
  User,
  MapPin,
  Scale,
  Truck,
  Loader2,
  CheckCircle,
  Building2,
  Send,
  LogOut,
  Wand2,
  Camera,
  Upload,
  Sparkles,
  X,
  Mic,
} from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import {
  ClipboardList,
  Search,
  Clock,
  ArrowLeft,
  Navigation,
  UserCircle,
  Plus,
  Eye,
  LocateFixed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressPicker, SavedAddressesManager, saveAddressFromBooking } from "@/components/customer/SavedAddresses";
import type { SavedAddressValue } from "@/components/customer/SavedAddresses";
import { BookingTrackingPanel } from "@/components/customer/BookingTrackingPanel";
import { buildCustomerTracking, type CustomerTrackingView } from "@shared/customer-tracking";

interface OfficeInfo {
  id: string;
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

interface PartnerInfo {
  id: string;
  name: string;
  code: string;
}

interface CustomerUserInfo {
  id: string;
  officeId: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  defaultPickupLat?: string | null;
  defaultPickupLng?: string | null;
}

interface BookingRequestInfo {
  id: string;
  requestNumber: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverCity?: string | null;
  status: string;
  serviceType?: string | null;
  createdAt: string;
  convertedShipmentId?: string | null;
  pickupLocationName?: string | null;
  reviewedAt?: string | null;
  senderCity?: string | null;
  senderState?: string | null;
  senderAddress?: string | null;
  receiverState?: string | null;
  receiverAddress?: string | null;
  tracking?: {
    overallStatus: string;
    overallStatusLabel: string;
    currentLocation: string;
    currentStatusDetail: string;
    isDelivered: boolean;
    isRejected: boolean;
  };
}

interface ShipmentTrackingInfo {
  bookingNumber: string;
  awbNumber?: string | null;
  status: string;
  senderCity?: string | null;
  receiverCity?: string | null;
  serviceType: string;
  weight: string;
  bookedAt: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
}

type TrackTabResult =
  | ({ kind: "shipment" } & ShipmentTrackingInfo & { tracking?: CustomerTrackingView })
  | {
      kind: "booking_request";
      requestNumber: string;
      status: string;
      senderCity?: string | null;
      receiverCity?: string | null;
      createdAt: string;
      message?: string;
      tracking?: CustomerTrackingView;
    };

interface GuestBookingRef {
  id: string;
  requestNumber: string;
  savedAt: string;
}

const PICKUP_TIME_SLOTS = [
  { value: "09:00-12:00", label: "Morning (9 AM – 12 PM)" },
  { value: "12:00-15:00", label: "Afternoon (12 PM – 3 PM)" },
  { value: "15:00-18:00", label: "Evening (3 PM – 6 PM)" },
  { value: "18:00-21:00", label: "Night (6 PM – 9 PM)" },
];

function guestBookingsStorageKey(slug: string) {
  return `xgoo_guest_bookings_${slug}`;
}

function guestModeStorageKey(slug: string) {
  return `xgoo_guest_mode_${slug}`;
}

function loadGuestBookings(slug: string): GuestBookingRef[] {
  try {
    const raw = localStorage.getItem(guestBookingsStorageKey(slug));
    const parsed = raw ? (JSON.parse(raw) as GuestBookingRef[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestBookingRef(slug: string, id: string, requestNumber: string) {
  const prev = loadGuestBookings(slug);
  prev.unshift({ id, requestNumber, savedAt: new Date().toISOString() });
  localStorage.setItem(guestBookingsStorageKey(slug), JSON.stringify(prev.slice(0, 20)));
}

function useCustomerAuth(slug: string) {
  const [user, setUser] = useState<CustomerUserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(`xgoo_customer_token_${slug}`);
    const savedUser = localStorage.getItem(`xgoo_customer_user_${slug}`);
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      fetch("/api/customer/me", {
        headers: { "x-customer-token": savedToken },
      }).then((res) => {
        if (res.ok) {
          return res.json().then((data) => {
            setUser(data);
            localStorage.setItem(`xgoo_customer_user_${slug}`, JSON.stringify(data));
          });
        } else {
          localStorage.removeItem(`xgoo_customer_token_${slug}`);
          localStorage.removeItem(`xgoo_customer_user_${slug}`);
          setToken(null);
          setUser(null);
        }
      }).catch(() => {}).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [slug]);

  const login = useCallback((userData: CustomerUserInfo, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(`xgoo_customer_token_${slug}`, authToken);
    localStorage.setItem(`xgoo_customer_user_${slug}`, JSON.stringify(userData));
  }, [slug]);

  const logout = useCallback(async () => {
    if (token) {
      await fetch("/api/customer/logout", {
        method: "POST",
        headers: { "x-customer-token": token },
      }).catch(() => {});
    }
    localStorage.removeItem(`xgoo_customer_token_${slug}`);
    localStorage.removeItem(`xgoo_customer_user_${slug}`);
    setUser(null);
    setToken(null);
  }, [slug, token]);

  return { user, token, isLoading, isAuthenticated: !!user && !!token, login, logout, setUser };
}

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  password: z.string().min(1, "Password is required"),
});

function toFormString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

function requiredText(label: string) {
  return z.preprocess(
    toFormString,
    z.string().trim().min(1, `${label} is required`),
  );
}

function optionalText() {
  return z.preprocess(toFormString, z.string());
}

function phoneText(label: string) {
  return z.preprocess(
    toFormString,
    z
      .string()
      .trim()
      .min(1, `${label} is required`)
      .refine((v) => v.replace(/\D/g, "").length >= 10, `${label} must be at least 10 digits`),
  );
}

function formatApiError(result: { message?: string; errors?: { path: (string | number)[]; message: string }[] }) {
  if (result.errors?.length) {
    return result.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
  }
  return result.message || "Request failed";
}

const bookingSchema = z.object({
  senderName: requiredText("Sender name"),
  senderPhone: phoneText("Sender phone"),
  senderEmail: z.preprocess(
    toFormString,
    z.string().refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Invalid sender email",
    ),
  ),
  senderAddress: requiredText("Sender address"),
  senderCity: optionalText(),
  senderState: optionalText(),
  senderPincode: optionalText(),
  receiverName: requiredText("Receiver name"),
  receiverPhone: phoneText("Receiver phone"),
  receiverAddress: requiredText("Receiver address"),
  receiverCity: optionalText(),
  receiverState: optionalText(),
  receiverPincode: optionalText(),
  weight: optionalText(),
  numberOfPieces: z.preprocess(
    (val) => {
      const s = toFormString(val);
      return s || "1";
    },
    z.string().min(1, "Number of pieces is required"),
  ),
  contentDescription: optionalText(),
  declaredValue: optionalText(),
  serviceType: z.preprocess(
    (val) => (val === "air" || val === "surface" ? val : "surface"),
    z.enum(["air", "surface"]),
  ),
  courierPreference: optionalText(),
  notes: optionalText(),
  packagePhotoUrls: z.array(z.string()).optional(),
  pickupDate: requiredText("Pickup date"),
  pickupTimeSlot: z.preprocess(
    (val) => toFormString(val) || "09:00-12:00",
    z.string().min(1, "Pickup time slot is required"),
  ),
});

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

function PickupMapComponent({ onLocationSelect, initialLat, initialLng, autoDetectOnMount }: {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  initialLat?: number;
  initialLng?: number;
  autoDetectOnMount?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationName, setLocationName] = useState("");
  const autoDetectRef = useRef(false);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 16);
          const L = await import("leaflet");
          const defaultIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = L.marker([latitude, longitude], { icon: defaultIcon, draggable: true }).addTo(leafletMapRef.current);
            markerRef.current.on("dragend", async () => {
              const pos = markerRef.current.getLatLng();
              const name = await reverseGeocode(pos.lat, pos.lng);
              setLocationName(name);
              onLocationSelect(pos.lat, pos.lng, name);
            });
          }
        }
        const name = await reverseGeocode(latitude, longitude);
        setLocationName(name);
        onLocationSelect(latitude, longitude, name);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const loadLeaflet = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const lat = initialLat || 20.5937;
      const lng = initialLng || 78.9629;
      const zoom = initialLat ? 15 : 5;

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([lat, lng], zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng], { icon: defaultIcon, draggable: true }).addTo(map);
        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current.getLatLng();
          const name = await reverseGeocode(pos.lat, pos.lng);
          setLocationName(name);
          onLocationSelect(pos.lat, pos.lng, name);
        });
      }

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: defaultIcon, draggable: true }).addTo(map);
          markerRef.current.on("dragend", async () => {
            const pos = markerRef.current.getLatLng();
            const name = await reverseGeocode(pos.lat, pos.lng);
            setLocationName(name);
            onLocationSelect(pos.lat, pos.lng, name);
          });
        }
        const name = await reverseGeocode(lat, lng);
        setLocationName(name);
        onLocationSelect(lat, lng, name);
      });

      leafletMapRef.current = map;

      if (autoDetectOnMount && !initialLat && !autoDetectRef.current) {
        autoDetectRef.current = true;
        setTimeout(() => detectLocation(), 500);
      }
    };

    loadLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  async function searchLocation() {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([latNum, lngNum], 16);
          const L = await import("leaflet");
          const defaultIcon = L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          if (markerRef.current) {
            markerRef.current.setLatLng([latNum, lngNum]);
          } else {
            markerRef.current = L.marker([latNum, lngNum], { icon: defaultIcon, draggable: true }).addTo(leafletMapRef.current);
            markerRef.current.on("dragend", async () => {
              const pos = markerRef.current.getLatLng();
              const name = await reverseGeocode(pos.lat, pos.lng);
              setLocationName(name);
              onLocationSelect(pos.lat, pos.lng, name);
            });
          }
        }
        setLocationName(display_name);
        onLocationSelect(latNum, lngNum, display_name);
      }
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchLocation())}
          data-testid="input-map-search"
        />
        <Button type="button" variant="outline" size="icon" onClick={searchLocation} data-testid="button-map-search">
          <Search className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={detectLocation} disabled={isLocating} data-testid="button-detect-location">
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={mapRef} className="leaflet-map-contained h-[250px] rounded-md border" data-testid="map-container" />
      {locationName && (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
          <span data-testid="text-location-name">{locationName}</span>
        </p>
      )}
    </div>
  );
}

function LoginForm({ slug, office, onLogin, onToggle, onContinueAsGuest }: {
  slug: string;
  office: OfficeInfo;
  onLogin: (user: CustomerUserInfo, token: string) => void;
  onToggle: () => void;
  onContinueAsGuest?: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  async function handleLogin(data: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/public/office/${slug}/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      onLogin(result.user, result.token);
      toast({ title: "Welcome back!", description: `Logged in as ${result.user.name}` });
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl" data-testid="text-auth-title">Welcome Back</CardTitle>
          <CardDescription>Sign in to book with {office.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input {...field} placeholder="10-digit phone" data-testid="input-login-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input {...field} type="password" placeholder="Your password" data-testid="input-login-password" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-login">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>
          </Form>
          <div className="mt-4 space-y-2 text-center">
            <Button variant="ghost" onClick={onToggle} data-testid="button-toggle-auth-mode" className="w-full">
              Don't have an account? Register
            </Button>
            {onContinueAsGuest && (
              <Button type="button" variant="outline" className="w-full" onClick={onContinueAsGuest} data-testid="button-continue-as-guest">
                Continue without signing up
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RegisterForm({ slug, office, onLogin, onToggle, onContinueAsGuest }: {
  slug: string;
  office: OfficeInfo;
  onLogin: (user: CustomerUserInfo, token: string) => void;
  onToggle: () => void;
  onContinueAsGuest?: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "", email: "", password: "", address: "", city: "", state: "", pincode: "" },
  });

  async function handleRegister(data: z.infer<typeof registerSchema>) {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/public/office/${slug}/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      onLogin(result.user, result.token);
      toast({ title: "Account Created!", description: `Welcome, ${result.user.name}` });
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl" data-testid="text-auth-title">Create Account</CardTitle>
          <CardDescription>Register to book courier services with {office.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} placeholder="Your name" data-testid="input-register-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 grid-cols-2">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input {...field} placeholder="10-digit" data-testid="input-register-phone" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="email" data-testid="input-register-email" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password *</FormLabel><FormControl><Input {...field} type="password" placeholder="Min 6 chars" data-testid="input-register-password" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="Your address" data-testid="input-register-address" /></FormControl></FormItem>
              )} />
              <div className="grid gap-4 grid-cols-3">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} placeholder="City" data-testid="input-register-city" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} placeholder="State" data-testid="input-register-state" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} placeholder="Pincode" data-testid="input-register-pincode" /></FormControl></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-register">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </Form>
          <div className="mt-4 space-y-2 text-center">
            <Button variant="ghost" onClick={onToggle} data-testid="button-toggle-auth-mode" className="w-full">
              Already have an account? Sign In
            </Button>
            {onContinueAsGuest && (
              <Button type="button" variant="outline" className="w-full" onClick={onContinueAsGuest} data-testid="button-continue-as-guest-register">
                Continue without signing up
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthPage({ slug, office, onLogin, onContinueAsGuest }: {
  slug: string;
  office: OfficeInfo;
  onLogin: (user: CustomerUserInfo, token: string) => void;
  onContinueAsGuest?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const toggle = useCallback(() => setMode((m) => (m === "login" ? "register" : "login")), []);

  if (mode === "register") {
    return <RegisterForm slug={slug} office={office} onLogin={onLogin} onToggle={toggle} onContinueAsGuest={onContinueAsGuest} />;
  }
  return <LoginForm slug={slug} office={office} onLogin={onLogin} onToggle={toggle} onContinueAsGuest={onContinueAsGuest} />;
}

function BookingTab({
  slug,
  partners,
  guestMode,
  token,
  user,
  onGuestBookingSaved,
}: {
  slug: string;
  partners: PartnerInfo[];
  guestMode?: boolean;
  token?: string;
  user?: CustomerUserInfo;
  onGuestBookingSaved?: () => void;
}) {
  const isGuest = !!(guestMode && !token);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ requestNumber: string } | null>(null);
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [saveSenderAddress, setSaveSenderAddress] = useState(false);
  const [saveReceiverAddress, setSaveReceiverAddress] = useState(false);
  const [smartFillText, setSmartFillText] = useState("");
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [packagePhotos, setPackagePhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);
  const [sectionAiText, setSectionAiText] = useState<Record<string, string>>({ sender: "", receiver: "", package: "", service: "" });
  const [sectionAiLoading, setSectionAiLoading] = useState<Record<string, boolean>>({ sender: false, receiver: false, package: false, service: false });
  const [recordingSection, setRecordingSection] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    shouldFocusError: true,
    defaultValues: {
      senderName: user?.name || "",
      senderPhone: user?.phone || "",
      senderEmail: user?.email || "",
      senderAddress: user?.address || "",
      senderCity: user?.city || "",
      senderState: user?.state || "",
      senderPincode: user?.pincode || "",
      receiverName: "",
      receiverPhone: "",
      receiverAddress: "",
      receiverCity: "",
      receiverState: "",
      receiverPincode: "",
      weight: "",
      numberOfPieces: "1",
      contentDescription: "",
      declaredValue: "",
      serviceType: "surface",
      courierPreference: partners.length > 0 ? "none" : "",
      notes: "",
      packagePhotoUrls: [],
      pickupDate: todayStr,
      pickupTimeSlot: "09:00-12:00",
    },
  });

  useEffect(() => {
    if (!user) return;
    if (user.name) form.setValue("senderName", user.name);
    if (user.phone) form.setValue("senderPhone", user.phone);
    if (user.email) form.setValue("senderEmail", user.email);
    if (user.address) form.setValue("senderAddress", user.address);
    if (user.city) form.setValue("senderCity", user.city);
    if (user.state) form.setValue("senderState", user.state);
    if (user.pincode) form.setValue("senderPincode", user.pincode);
  }, [user, form]);

  function applySavedAddress(prefix: "sender" | "receiver", addr: SavedAddressValue) {
    form.setValue(`${prefix}Name` as any, addr.name);
    form.setValue(`${prefix}Phone` as any, addr.phone);
    form.setValue(`${prefix}Address` as any, addr.address);
    if (addr.city) form.setValue(`${prefix}City` as any, addr.city);
    if (addr.state) form.setValue(`${prefix}State` as any, addr.state);
    if (addr.pincode) form.setValue(`${prefix}Pincode` as any, addr.pincode);
    if (prefix === "sender" && addr.lat && addr.lng) {
      setPickupLocation({ lat: parseFloat(addr.lat), lng: parseFloat(addr.lng), name: addr.address });
    }
  }

  async function handleSmartFill() {
    if (!smartFillText.trim()) return;
    setIsSmartFilling(true);
    try {
      const res = await fetch("/api/public/ai/smart-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: smartFillText,
          senderName: user?.name,
          senderPhone: user?.phone,
          senderAddress: user?.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const fieldMap: Record<string, string> = {
        receiverName: "receiverName", receiverPhone: "receiverPhone",
        receiverAddress: "receiverAddress", receiverCity: "receiverCity",
        receiverState: "receiverState", receiverPincode: "receiverPincode",
        weight: "weight", numberOfPieces: "numberOfPieces",
        contentDescription: "contentDescription", declaredValue: "declaredValue",
        serviceType: "serviceType", notes: "notes",
      };
      let filled = 0;
      for (const [key, formKey] of Object.entries(fieldMap)) {
        if (data[key]) {
          form.setValue(formKey as any, String(data[key]));
          filled++;
        }
      }
      toast({ title: "AI Smart Fill", description: `Filled ${filled} fields from your description.` });
      setSmartFillText("");
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message || "Could not parse description", variant: "destructive" });
    } finally {
      setIsSmartFilling(false);
    }
  }

  async function handleCameraScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsMeasuring(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/public/ai/measure-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (data.estimatedWeight) form.setValue("weight", String(data.estimatedWeight));
      if (data.contentDescription) form.setValue("contentDescription", data.contentDescription);
      toast({
        title: "Package Measured",
        description: `~${data.length || "?"}x${data.width || "?"}x${data.height || "?"}cm, ~${data.estimatedWeight || "?"}kg (${data.confidence || "low"} confidence)`,
      });
    } catch (err: any) {
      toast({ title: "Measurement Error", description: err.message, variant: "destructive" });
    } finally {
      setIsMeasuring(false);
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (isGuest) {
      toast({ title: "Photos", description: "Sign in to attach package photos. Guests can still submit the booking without photos.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file || packagePhotos.length >= 3) return;
    setIsUploading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["x-customer-token"] = token;
      const urlRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}));
        throw new Error(formatApiError(err));
      }
      const { uploadURL, objectPath } = await urlRes.json();
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type, ...(token ? { "x-customer-token": token } : {}) },
      });
      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload photo");
      }
      const putData = await putRes.json();
      const savedPath = putData.objectPath || objectPath;
      const newPhotos = [...packagePhotos, savedPath];
      setPackagePhotos(newPhotos);
      form.setValue("packagePhotoUrls", newPhotos);
      toast({ title: "Photo Uploaded", description: `${newPhotos.length}/3 photos added` });
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (photoUploadRef.current) photoUploadRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    const newPhotos = packagePhotos.filter((_, i) => i !== index);
    setPackagePhotos(newPhotos);
    form.setValue("packagePhotoUrls", newPhotos);
  }

  async function handleSectionAiFill(section: string) {
    const text = sectionAiText[section];
    if (!text?.trim()) return;
    setSectionAiLoading(prev => ({ ...prev, [section]: true }));
    try {
      const body: any = { section, description: text, senderName: user?.name, senderPhone: user?.phone, senderAddress: user?.address };
      const res = await fetch("/api/public/ai/section-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const sectionFields: Record<string, string[]> = {
        sender: ["senderName", "senderPhone", "senderEmail", "senderAddress", "senderCity", "senderState", "senderPincode"],
        receiver: ["receiverName", "receiverPhone", "receiverAddress", "receiverCity", "receiverState", "receiverPincode"],
        package: ["weight", "numberOfPieces", "contentDescription", "declaredValue"],
        service: ["serviceType", "courierPreference", "notes"],
      };
      let filled = 0;
      for (const key of sectionFields[section] || []) {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
          form.setValue(key as any, String(data[key]));
          filled++;
        }
      }
      toast({ title: "AI Filled", description: `${filled} field(s) auto-filled.` });
      setSectionAiText(prev => ({ ...prev, [section]: "" }));
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message || "Could not process", variant: "destructive" });
    } finally {
      setSectionAiLoading(prev => ({ ...prev, [section]: false }));
    }
  }

  async function handleVoiceRecord(section: string) {
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
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await fetch("/api/public/ai/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64 }),
            });
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
      setTimeout(() => { if (mediaRecorder.state === 'recording') { mediaRecorder.stop(); setRecordingSection(null); } }, 15000);
    } catch (err) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice input", variant: "destructive" });
    }
  }

  async function handleSmartFillVoice() {
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
            const res = await fetch("/api/public/ai/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64 }),
            });
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
  }

  function flattenFormErrors(
    errors: Record<string, unknown>,
    prefix = "",
  ): Array<{ field: string; message: string }> {
    const out: Array<{ field: string; message: string }> = [];
    for (const [key, val] of Object.entries(errors)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === "object" && "message" in val && val.message) {
        out.push({ field: path, message: String(val.message) });
      } else if (val && typeof val === "object") {
        out.push(...flattenFormErrors(val as Record<string, unknown>, path));
      }
    }
    return out;
  }

  const FIELD_LABELS: Record<string, string> = {
    senderName: "Sender name",
    senderPhone: "Sender phone",
    senderEmail: "Sender email",
    senderAddress: "Sender address",
    receiverName: "Receiver name",
    receiverPhone: "Receiver phone",
    receiverAddress: "Receiver address",
    pickupDate: "Pickup date",
    pickupTimeSlot: "Pickup time slot",
    numberOfPieces: "Number of pieces",
  };

  const FIELD_TEST_IDS: Record<string, string> = {
    senderName: "input-sender-name",
    senderPhone: "input-sender-phone",
    senderEmail: "input-sender-email",
    senderAddress: "input-sender-address",
    receiverName: "input-receiver-name",
    receiverPhone: "input-receiver-phone",
    receiverAddress: "input-receiver-address",
    pickupDate: "input-pickup-date",
    pickupTimeSlot: "select-pickup-time",
    numberOfPieces: "input-pieces",
    weight: "input-weight",
    declaredValue: "input-declared-value",
    serviceType: "select-service-type",
  };

  function handleFormInvalid(errors: Record<string, { message?: string }>) {
    const flat = flattenFormErrors(errors);
    const summary = flat
      .slice(0, 4)
      .map((e) => {
        const label = FIELD_LABELS[e.field] || e.field;
        const msg = e.message && e.message !== "Required" ? e.message : `${label} is required`;
        return msg.includes(label) ? msg : `${label}: ${msg}`;
      })
      .join(" · ");
    toast({
      title: "Please check the form",
      description: summary || "Fill all required fields before submitting.",
      variant: "destructive",
      duration: 10000,
    });
    const first = flat[0];
    const testId = first ? FIELD_TEST_IDS[first.field] : null;
    const el =
      (testId && document.querySelector(`[data-testid="${testId}"]`)) ||
      document.querySelector("[aria-invalid='true']");
    if (el && "scrollIntoView" in el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if ("focus" in el && typeof el.focus === "function") {
        (el as HTMLElement).focus();
      }
    }
  }

  async function onSubmit(data: z.infer<typeof bookingSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        numberOfPieces: parseInt(data.numberOfPieces) || 1,
        declaredValue: data.declaredValue || null,
        courierPreference:
          !data.courierPreference || data.courierPreference === "none"
            ? null
            : data.courierPreference,
        packagePhotoUrls: packagePhotos.length > 0 ? packagePhotos : undefined,
        pickupLat: pickupLocation?.lat?.toString() || null,
        pickupLng: pickupLocation?.lng?.toString() || null,
        pickupLocationName: pickupLocation?.name || null,
        pickupDate: data.pickupDate,
        pickupTimeSlot: data.pickupTimeSlot,
      };
      if (isGuest) {
        const res = await fetch(`/api/public/office/${slug}/booking-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(formatApiError(result));
        if (result.id && result.requestNumber) {
          saveGuestBookingRef(slug, result.id, result.requestNumber);
          onGuestBookingSaved?.();
        }
        setSubmitted({ requestNumber: result.requestNumber });
        setPackagePhotos([]);
        toast({ title: "Booking Submitted!", description: `Save request #${result.requestNumber} to track status.` });
        return;
      }
      const res = await fetch("/api/customer/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-customer-token": token! },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(formatApiError(result));
      if (!isGuest && token) {
        if (pickupLocation) {
          await fetch("/api/customer/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-customer-token": token },
            body: JSON.stringify({
              defaultPickupLat: pickupLocation.lat.toString(),
              defaultPickupLng: pickupLocation.lng.toString(),
            }),
          });
        }
        if (saveSenderAddress) {
          await saveAddressFromBooking(token, {
            label: "Pickup",
            name: data.senderName,
            phone: data.senderPhone,
            address: data.senderAddress,
            city: data.senderCity,
            state: data.senderState,
            pincode: data.senderPincode,
            lat: pickupLocation?.lat?.toString() || null,
            lng: pickupLocation?.lng?.toString() || null,
            addressType: "sender",
          });
        }
        if (saveReceiverAddress) {
          await saveAddressFromBooking(token, {
            label: "Delivery",
            name: data.receiverName,
            phone: data.receiverPhone,
            address: data.receiverAddress,
            city: data.receiverCity,
            state: data.receiverState,
            pincode: data.receiverPincode,
            addressType: "receiver",
          });
        }
      }
      setSubmitted({ requestNumber: result.requestNumber });
      setPackagePhotos([]);
      toast({ title: "Booking Submitted!", description: `Request #${result.requestNumber}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-booking-success">Booking Submitted!</h2>
            <p className="text-muted-foreground mb-6">Your booking request has been sent for processing.</p>
            <div className="bg-muted rounded-md p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Request Number</p>
              <p className="text-2xl font-mono font-bold text-primary" data-testid="text-booking-request-number">{submitted.requestNumber}</p>
            </div>
            <Button variant="outline" onClick={() => { setSubmitted(null); form.reset({ ...form.getValues(), receiverName: "", receiverPhone: "", receiverAddress: "", receiverCity: "", receiverState: "", receiverPincode: "", weight: "", contentDescription: "", declaredValue: "", notes: "" }); setPickupLocation(null); }} data-testid="button-book-another">
              Book Another Shipment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-4 pb-28">
      <div className="mb-6">
        <h2 className="text-xl font-bold" data-testid="text-booking-title">Book a Shipment</h2>
        <p className="text-muted-foreground text-sm">
          {isGuest
            ? "Fill in your details. You will get a request number to track this booking."
            : "Fill in details below. Your sender info is pre-filled from your profile."}
        </p>
      </div>
      <input type="file" ref={cameraRef} accept="image/*" capture="environment" className="hidden" onChange={handleCameraScan} data-testid="input-camera-scan" />
      <input type="file" ref={photoUploadRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} data-testid="input-photo-upload" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleFormInvalid)} className="space-y-6 pb-28">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <LocateFixed className="h-4 w-4 text-primary" /> Your Pickup Location
              </CardTitle>
              <CardDescription>We detect your current location automatically. Adjust the pin if needed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pickupLocation && (
                <div className="rounded-md border bg-background px-3 py-2">
                  <p className="text-xs text-muted-foreground">Current location</p>
                  <p className="text-sm font-medium line-clamp-2">{pickupLocation.name}</p>
                </div>
              )}
              <PickupMapComponent
                onLocationSelect={(lat, lng, name) => setPickupLocation({ lat, lng, name })}
                initialLat={user?.defaultPickupLat ? parseFloat(user.defaultPickupLat) : undefined}
                initialLng={user?.defaultPickupLng ? parseFloat(user.defaultPickupLng) : undefined}
                autoDetectOnMount
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Schedule Pickup</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="pickupDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Date *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" min={new Date().toISOString().split("T")[0]} data-testid="input-pickup-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="pickupTimeSlot" render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Slot *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "09:00-12:00"}>
                    <FormControl><SelectTrigger data-testid="select-pickup-time"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PICKUP_TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Smart Fill</span>
                <Badge variant="secondary" className="text-xs no-default-hover-elevate no-default-active-elevate">AI</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Describe your shipment in plain words and we'll fill the form for you.</p>
              <div className="flex gap-2">
                <Input
                  value={smartFillText}
                  onChange={(e) => setSmartFillText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSmartFill(); } }}
                  placeholder='e.g. "Send 2kg documents to Amit in Mumbai 400001"'
                  disabled={isSmartFilling}
                  data-testid="input-smart-fill"
                />
                <Button type="button" size="icon" variant="ghost" onClick={handleSmartFillVoice} data-testid="button-mic-smartfill" className={recordingSection === "smartfill" ? "text-red-500" : ""}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" onClick={handleSmartFill} disabled={isSmartFilling || !smartFillText.trim()} data-testid="button-smart-fill">
                  {isSmartFilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Sender Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isGuest && token && (
                <AddressPicker token={token} addressType="sender" onSelect={(a) => applySavedAddress("sender", a)} />
              )}
              <div className="flex gap-2 mb-1 pb-3 border-b border-dashed">
                <div className="flex items-center gap-1.5 shrink-0"><Sparkles className="h-3.5 w-3.5 text-primary" /></div>
                <Input value={sectionAiText.sender} onChange={(e) => setSectionAiText(prev => ({ ...prev, sender: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("sender"); } }} placeholder='e.g. Raj Kumar, 9876543210, MG Road Bangalore (any language)' className="text-sm" disabled={sectionAiLoading.sender} data-testid="input-ai-sender" />
                <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("sender")} data-testid="button-mic-sender" className={recordingSection === "sender" ? "text-red-500" : ""}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => handleSectionAiFill("sender")} disabled={sectionAiLoading.sender || !sectionAiText.sender?.trim()} data-testid="button-ai-sender">
                  {sectionAiLoading.sender ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="senderName" render={({ field }) => (
                  <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} data-testid="input-sender-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="senderPhone" render={({ field }) => (
                  <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input {...field} data-testid="input-sender-phone" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="senderEmail" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" data-testid="input-sender-email" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="senderAddress" render={({ field }) => (
                <FormItem><FormLabel>Address *</FormLabel><FormControl><Textarea {...field} className="resize-none" data-testid="input-sender-address" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="senderCity" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} data-testid="input-sender-city" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="senderState" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} data-testid="input-sender-state" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="senderPincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} data-testid="input-sender-pincode" /></FormControl></FormItem>
                )} />
              </div>
              {!isGuest && token && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={saveSenderAddress} onCheckedChange={(v) => setSaveSenderAddress(!!v)} />
                  Save sender address for future bookings
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Receiver Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isGuest && token && (
                <AddressPicker token={token} addressType="receiver" onSelect={(a) => applySavedAddress("receiver", a)} />
              )}
              <div className="flex gap-2 mb-1 pb-3 border-b border-dashed">
                <div className="flex items-center gap-1.5 shrink-0"><Sparkles className="h-3.5 w-3.5 text-primary" /></div>
                <Input value={sectionAiText.receiver} onChange={(e) => setSectionAiText(prev => ({ ...prev, receiver: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("receiver"); } }} placeholder='e.g. Amit ko Delhi Connaught Place bhejo (any language)' className="text-sm" disabled={sectionAiLoading.receiver} data-testid="input-ai-receiver" />
                <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("receiver")} data-testid="button-mic-receiver" className={recordingSection === "receiver" ? "text-red-500" : ""}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => handleSectionAiFill("receiver")} disabled={sectionAiLoading.receiver || !sectionAiText.receiver?.trim()} data-testid="button-ai-receiver">
                  {sectionAiLoading.receiver ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="receiverName" render={({ field }) => (
                  <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} data-testid="input-receiver-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="receiverPhone" render={({ field }) => (
                  <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input {...field} data-testid="input-receiver-phone" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="receiverAddress" render={({ field }) => (
                <FormItem><FormLabel>Address *</FormLabel><FormControl><Textarea {...field} className="resize-none" data-testid="input-receiver-address" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField control={form.control} name="receiverCity" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} data-testid="input-receiver-city" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="receiverState" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} data-testid="input-receiver-state" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="receiverPincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} data-testid="input-receiver-pincode" /></FormControl></FormItem>
                )} />
              </div>
              {!isGuest && token && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={saveReceiverAddress} onCheckedChange={(v) => setSaveReceiverAddress(!!v)} />
                  Save receiver address for future bookings
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4" /> Package Details</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs no-default-hover-elevate no-default-active-elevate">AI</Badge>
                  <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()} disabled={isMeasuring} data-testid="button-scan-package">
                    {isMeasuring ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                    Scan Package
                  </Button>
                </div>
              </div>
              <CardDescription>Enter details manually or scan your package with AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-1 pb-3 border-b border-dashed">
                <div className="flex items-center gap-1.5 shrink-0"><Sparkles className="h-3.5 w-3.5 text-primary" /></div>
                <Input value={sectionAiText.package} onChange={(e) => setSectionAiText(prev => ({ ...prev, package: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("package"); } }} placeholder='e.g. 5 kilo electronics, value 10000 (any language)' className="text-sm" disabled={sectionAiLoading.package} data-testid="input-ai-package" />
                <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("package")} data-testid="button-mic-package" className={recordingSection === "package" ? "text-red-500" : ""}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => handleSectionAiFill("package")} disabled={sectionAiLoading.package || !sectionAiText.package?.trim()} data-testid="button-ai-package">
                  {sectionAiLoading.package ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem><FormLabel>Approx. Weight (kg)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} type="number" step="0.1" data-testid="input-weight" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="numberOfPieces" render={({ field }) => (
                  <FormItem><FormLabel>No. of Pieces</FormLabel><FormControl><Input {...field} value={field.value ?? ""} type="number" min="1" data-testid="input-pieces" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="contentDescription" render={({ field }) => (
                <FormItem><FormLabel>Content Description</FormLabel><FormControl><Input {...field} placeholder="e.g., Documents, Electronics" data-testid="input-content" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="declaredValue" render={({ field }) => (
                <FormItem><FormLabel>Declared Value (Rs.)</FormLabel><FormControl><Input {...field} value={field.value ?? ""} type="number" data-testid="input-declared-value" /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="border-t pt-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm font-medium">Package Photos</span>
                    <span className="text-xs text-muted-foreground">({packagePhotos.length}/3)</span>
                  </div>
                  {packagePhotos.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => (isGuest ? toast({ title: "Photos", description: "Sign in to attach package photos." }) : photoUploadRef.current?.click())}
                      disabled={isUploading}
                      data-testid="button-upload-photo"
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                      Add Photo
                    </Button>
                  )}
                </div>
                {packagePhotos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {packagePhotos.map((url, i) => (
                      <div key={i} className="relative group">
                        <div className="h-20 w-20 rounded-md border overflow-hidden bg-muted">
                          <img src={url} alt={`Package ${i + 1}`} className="h-full w-full object-cover" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                          onClick={() => removePhoto(i)}
                          data-testid={`button-remove-photo-${i}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {packagePhotos.length === 0 && (
                  <p className="text-xs text-muted-foreground">Optionally add photos of your package for better service.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4" /> Service Preference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-1 pb-3 border-b border-dashed">
                <div className="flex items-center gap-1.5 shrink-0"><Sparkles className="h-3.5 w-3.5 text-primary" /></div>
                <Input value={sectionAiText.service} onChange={(e) => setSectionAiText(prev => ({ ...prev, service: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSectionAiFill("service"); } }} placeholder='e.g. air express urgent delivery (any language)' className="text-sm" disabled={sectionAiLoading.service} data-testid="input-ai-service" />
                <Button type="button" size="icon" variant="ghost" onClick={() => handleVoiceRecord("service")} data-testid="button-mic-service" className={recordingSection === "service" ? "text-red-500" : ""}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => handleSectionAiFill("service")} disabled={sectionAiLoading.service || !sectionAiText.service?.trim()} data-testid="button-ai-service">
                  {sectionAiLoading.service ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-service-type"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="surface">Surface (Standard)</SelectItem>
                      <SelectItem value="air">Air (Express)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {partners.length > 0 && (
                <FormField control={form.control} name="courierPreference" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Courier (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl><SelectTrigger data-testid="select-courier"><SelectValue placeholder="No preference" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No preference</SelectItem>
                        {partners.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} className="resize-none" placeholder="Any special instructions" data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex max-w-3xl items-center gap-3 p-4">
              <p className="hidden text-xs text-muted-foreground sm:block">
                Review your details, then submit your pickup request.
              </p>
              <Button
                type="submit"
                className="ml-auto w-full sm:w-auto sm:min-w-[220px]"
                disabled={isSubmitting}
                data-testid="button-submit-booking"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Booking Request
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "pending": return "secondary";
    case "approved": case "converted": return "default";
    case "rejected": return "destructive";
    case "booked": return "secondary";
    case "picked_up": return "default";
    case "in_transit": return "default";
    case "delivered": return "default";
    default: return "secondary";
  }
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapRequestForTracking(request: BookingRequestInfo) {
  return {
    status: request.status,
    createdAt: request.createdAt,
    reviewedAt: request.reviewedAt,
    pickupLocationName: request.pickupLocationName,
    senderCity: request.senderCity,
    senderState: request.senderState,
    senderAddress: request.senderAddress,
    receiverCity: request.receiverCity,
    receiverState: request.receiverState,
    receiverAddress: request.receiverAddress,
  };
}

function mapShipmentForTracking(shipment: ShipmentTrackingInfo | null | undefined) {
  if (!shipment) return null;
  return {
    status: shipment.status,
    bookedAt: shipment.bookedAt,
    pickedUpAt: shipment.pickedUpAt,
    deliveredAt: shipment.deliveredAt,
    senderCity: shipment.senderCity,
    receiverCity: shipment.receiverCity,
    bookingNumber: shipment.bookingNumber,
    awbNumber: shipment.awbNumber,
  };
}

function MyBookingsTab({ token }: { token: string }) {
  const [bookings, setBookings] = useState<BookingRequestInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<{
    request: BookingRequestInfo;
    shipment: ShipmentTrackingInfo | null;
    tracking: CustomerTrackingView;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/customer/bookings", {
      headers: { "x-customer-token": token },
    })
      .then((r) => r.json())
      .then((data) => setBookings(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  async function viewDetail(id: string) {
    setSelectedBooking(id);
    setIsLoadingDetail(true);
    setBookingDetail(null);
    try {
      const res = await fetch(`/api/customer/bookings/${id}`, {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) return;
      const data = await res.json();
      const request = data.request as BookingRequestInfo;
      const shipment = data.shipment as ShipmentTrackingInfo | null;
      const tracking =
        data.tracking ??
        buildCustomerTracking(mapRequestForTracking(request), mapShipmentForTracking(shipment));
      setBookingDetail({ request, shipment, tracking });
    } catch {}
    setIsLoadingDetail(false);
  }

  if (selectedBooking) {
    if (isLoadingDetail || !bookingDetail) {
      return (
        <div className="mx-auto max-w-2xl py-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedBooking(null); setBookingDetail(null); }} className="mb-4" data-testid="button-back-to-bookings">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Bookings
          </Button>
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    const { request, shipment, tracking } = bookingDetail;
    return (
      <div className="mx-auto max-w-2xl py-4">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedBooking(null); setBookingDetail(null); }} className="mb-4" data-testid="button-back-to-bookings">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Bookings
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg" data-testid="text-detail-request-number">#{request.requestNumber}</CardTitle>
              <Badge variant={statusColor(tracking.overallStatus)} data-testid="badge-detail-status">
                {tracking.overallStatusLabel}
              </Badge>
            </div>
            <CardDescription>Submitted {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-1">Sender</p>
                <p className="text-sm">{request.senderName}</p>
                <p className="text-sm text-muted-foreground">{request.senderPhone}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Receiver</p>
                <p className="text-sm">{request.receiverName}</p>
                <p className="text-sm text-muted-foreground">{request.receiverCity || "N/A"}</p>
              </div>
            </div>
            {request.pickupLocationName && (
              <div>
                <p className="text-sm font-medium mb-1">Pickup Location</p>
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  {request.pickupLocationName}
                </p>
              </div>
            )}
            <BookingTrackingPanel
              tracking={tracking}
              bookingNumber={shipment?.bookingNumber}
              awbNumber={shipment?.awbNumber}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <h2 className="text-xl font-bold mb-4" data-testid="text-my-bookings-title">My Bookings</h2>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bookings yet. Start by booking a shipment!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="hover-elevate cursor-pointer" onClick={() => viewDetail(b.id)} data-testid={`card-booking-${b.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-mono font-bold text-sm" data-testid={`text-request-number-${b.id}`}>#{b.requestNumber}</p>
                    <p className="text-sm text-muted-foreground">{b.senderName} &rarr; {b.receiverName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {b.receiverCity ? ` | To: ${b.receiverCity}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(b.tracking?.overallStatus ?? b.status)} className="text-xs">
                      {b.tracking?.overallStatusLabel ?? statusLabel(b.status)}
                    </Badge>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {b.tracking?.currentLocation && (
                  <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{b.tracking.currentLocation}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function mapShipmentForGuest(s: Record<string, unknown> | null | undefined): ShipmentTrackingInfo | null {
  if (!s || typeof s !== "object") return null;
  return {
    bookingNumber: String(s.bookingNumber ?? ""),
    awbNumber: (s.awbNumber as string) ?? null,
    status: String(s.status ?? ""),
    senderCity: (s.senderCity as string) ?? null,
    receiverCity: (s.receiverCity as string) ?? null,
    serviceType: String(s.serviceType ?? ""),
    weight: String(s.weight ?? ""),
    bookedAt: String(s.bookedAt ?? ""),
    pickedUpAt: (s.pickedUpAt as string) ?? null,
    deliveredAt: (s.deliveredAt as string) ?? null,
  };
}

function GuestBookingsTab({ slug, refreshTick }: { slug: string; refreshTick: number }) {
  const { toast } = useToast();
  const [refs, setRefs] = useState<GuestBookingRef[]>([]);
  const [selectedRequestNumber, setSelectedRequestNumber] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<{
    request: BookingRequestInfo;
    shipment: ShipmentTrackingInfo | null;
    tracking: CustomerTrackingView;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    setRefs(loadGuestBookings(slug));
  }, [slug, refreshTick]);

  async function viewDetail(requestNumber: string) {
    setSelectedRequestNumber(requestNumber);
    setIsLoadingDetail(true);
    setBookingDetail(null);
    try {
      const res = await fetch(
        `/api/public/office/${encodeURIComponent(slug)}/booking-request/${encodeURIComponent(requestNumber)}`
      );
      if (!res.ok) {
        toast({ title: "Not found", description: "Could not load this booking. Try Track with your request number.", variant: "destructive" });
        setSelectedRequestNumber(null);
        return;
      }
      const data = await res.json();
      const r = data.request;
      if (!r) {
        toast({ title: "Not found", description: "Invalid response from server.", variant: "destructive" });
        setSelectedRequestNumber(null);
        return;
      }
      const request: BookingRequestInfo = {
        id: r.id,
        requestNumber: r.requestNumber,
        senderName: r.senderName,
        senderPhone: r.senderPhone,
        receiverName: r.receiverName,
        receiverCity: r.receiverCity,
        status: r.status,
        serviceType: r.serviceType,
        createdAt: r.createdAt,
        convertedShipmentId: r.convertedShipmentId,
        pickupLocationName: r.pickupLocationName,
        reviewedAt: r.reviewedAt,
        senderCity: r.senderCity,
        senderState: r.senderState,
        senderAddress: r.senderAddress,
        receiverState: r.receiverState,
        receiverAddress: r.receiverAddress,
      };
      const shipment = mapShipmentForGuest(data.shipment);
      const tracking =
        data.tracking ??
        buildCustomerTracking(mapRequestForTracking(request), mapShipmentForTracking(shipment));
      setBookingDetail({ request, shipment, tracking });
    } catch {
      toast({ title: "Error", description: "Could not load booking details.", variant: "destructive" });
      setSelectedRequestNumber(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  if (selectedRequestNumber) {
    if (isLoadingDetail || !bookingDetail) {
      return (
        <div className="mx-auto max-w-2xl py-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedRequestNumber(null); setBookingDetail(null); }} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }
    const { request, shipment, tracking } = bookingDetail;
    return (
      <div className="mx-auto max-w-2xl py-4">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedRequestNumber(null); setBookingDetail(null); }} className="mb-4" data-testid="button-guest-back-to-bookings">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to My bookings
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg" data-testid="text-guest-detail-request-number">#{request.requestNumber}</CardTitle>
              <Badge variant={statusColor(tracking.overallStatus)}>{tracking.overallStatusLabel}</Badge>
            </div>
            <CardDescription>
              Submitted {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-1">Sender</p>
                <p className="text-sm">{request.senderName}</p>
                <p className="text-sm text-muted-foreground">{request.senderPhone}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Receiver</p>
                <p className="text-sm">{request.receiverName}</p>
                <p className="text-sm text-muted-foreground">{request.receiverCity || "N/A"}</p>
              </div>
            </div>
            {request.pickupLocationName && (
              <div>
                <p className="text-sm font-medium mb-1">Pickup Location</p>
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  {request.pickupLocationName}
                </p>
              </div>
            )}
            <BookingTrackingPanel
              tracking={tracking}
              bookingNumber={shipment?.bookingNumber}
              awbNumber={shipment?.awbNumber}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <h2 className="text-xl font-bold mb-2" data-testid="text-guest-my-bookings-title">My bookings (this device)</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Request numbers you create as a guest are saved in this browser. You can also use Track and enter any request, booking, or AWB number.
      </p>
      {refs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No guest bookings saved yet. Submit a booking from the Book tab.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {refs.map((ref) => (
            <Card
              key={`${ref.id}-${ref.requestNumber}`}
              className="hover-elevate cursor-pointer"
              onClick={() => viewDetail(ref.requestNumber)}
              data-testid={`card-guest-booking-${ref.requestNumber}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-mono font-bold text-sm">#{ref.requestNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Saved {new Date(ref.savedAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackTab({ slug }: { slug: string }) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [result, setResult] = useState<TrackTabResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  async function handleTrack() {
    if (!trackingNumber.trim()) return;
    setIsSearching(true);
    setNotFound(false);
    setResult(null);
    try {
      const res = await fetch(
        `/api/public/office/${encodeURIComponent(slug)}/track/${encodeURIComponent(trackingNumber.trim())}`
      );
      if (res.status === 404) {
        setNotFound(true);
      } else if (res.ok) {
        setResult((await res.json()) as TrackTabResult);
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.message || "Could not look up this number", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to track shipment", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-4">
      <h2 className="text-xl font-bold mb-4" data-testid="text-track-title">Track booking</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Enter your request number (e.g. BR…), booking number, or AWB for this office.
      </p>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Request #, booking #, or AWB"
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              data-testid="input-tracking-number"
            />
            <Button onClick={handleTrack} disabled={isSearching} data-testid="button-track">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {notFound && (
            <div className="text-center py-6">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground" data-testid="text-not-found">No booking found with this number for this office</p>
            </div>
          )}

          {result?.kind === "booking_request" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Request number</p>
                  <p className="font-mono font-bold" data-testid="text-track-result-number">{result.requestNumber}</p>
                </div>
                <Badge variant={statusColor(result.tracking?.overallStatus ?? result.status)}>
                  {result.tracking?.overallStatusLabel ?? statusLabel(result.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">From</p><p>{result.senderCity || "N/A"}</p></div>
                <div><p className="text-muted-foreground">To</p><p>{result.receiverCity || "N/A"}</p></div>
              </div>
              {result.createdAt && (
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(result.createdAt).toLocaleString("en-IN")}
                </p>
              )}
              <BookingTrackingPanel
                tracking={
                  result.tracking ??
                  buildCustomerTracking(
                    {
                      status: result.status,
                      createdAt: result.createdAt,
                      senderCity: result.senderCity,
                      receiverCity: result.receiverCity,
                    },
                    null,
                  )
                }
              />
            </div>
          )}

          {result?.kind === "shipment" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">From</p><p>{result.senderCity || "N/A"}</p></div>
                <div><p className="text-muted-foreground">To</p><p>{result.receiverCity || "N/A"}</p></div>
                <div><p className="text-muted-foreground">Service</p><p className="capitalize">{result.serviceType}</p></div>
                <div><p className="text-muted-foreground">Weight</p><p>{result.weight} kg</p></div>
              </div>
              <BookingTrackingPanel
                tracking={
                  result.tracking ??
                  buildCustomerTracking(
                    {
                      status: "converted",
                      createdAt: result.bookedAt,
                      senderCity: result.senderCity,
                      receiverCity: result.receiverCity,
                    },
                    {
                      status: result.status,
                      bookedAt: result.bookedAt,
                      pickedUpAt: result.pickedUpAt,
                      deliveredAt: result.deliveredAt,
                      senderCity: result.senderCity,
                      receiverCity: result.receiverCity,
                      bookingNumber: result.bookingNumber,
                      awbNumber: result.awbNumber,
                    },
                  )
                }
                bookingNumber={result.bookingNumber}
                awbNumber={result.awbNumber}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccountTab({ token, user, onUserUpdate, onLogout }: {
  token: string;
  user: CustomerUserInfo;
  onUserUpdate: (user: CustomerUserInfo) => void;
  onLogout: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
    },
  });

  async function onSubmit(data: z.infer<typeof profileSchema>) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-customer-token": token },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      onUserUpdate(result);
      toast({ title: "Profile Updated", description: "Your details have been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-4">
      <h2 className="text-xl font-bold mb-4" data-testid="text-account-title">My Account</h2>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} data-testid="input-profile-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 grid-cols-2">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} data-testid="input-profile-phone" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" data-testid="input-profile-email" /></FormControl></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Default Address</FormLabel><FormControl><Input {...field} data-testid="input-profile-address" /></FormControl></FormItem>
              )} />
              <div className="grid gap-4 grid-cols-3">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} data-testid="input-profile-city" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} data-testid="input-profile-state" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="pincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} data-testid="input-profile-pincode" /></FormControl></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-save-profile">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </form>
          </Form>
          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" className="w-full" onClick={onLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
      <SavedAddressesManager token={token} />
    </div>
  );
}

export default function CustomerPortalPage() {
  const params = useParams<{ slug?: string }>();
  const routeSlug = params.slug || "";
  const [slug, setSlug] = useState(routeSlug);
  const [office, setOffice] = useState<OfficeInfo | null>(null);
  const [partners, setPartners] = useState<PartnerInfo[]>([]);
  const [isLoadingOffice, setIsLoadingOffice] = useState(true);
  const [officeError, setOfficeError] = useState(false);
  const auth = useCustomerAuth(slug);
  const [activeTab, setActiveTab] = useState("book");
  const [guestMode, setGuestMode] = useState(false);
  const [guestBookingsTick, setGuestBookingsTick] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setGuestMode(localStorage.getItem(guestModeStorageKey(slug)) === "1");
  }, [slug]);

  useEffect(() => {
    if (auth.isAuthenticated && slug) {
      localStorage.removeItem(guestModeStorageKey(slug));
      setGuestMode(false);
    }
  }, [auth.isAuthenticated, slug]);

  const enterGuestMode = useCallback(() => {
    if (!slug) return;
    localStorage.setItem(guestModeStorageKey(slug), "1");
    setGuestMode(true);
    setActiveTab("book");
  }, [slug]);

  const exitGuestMode = useCallback(() => {
    if (!slug) return;
    localStorage.removeItem(guestModeStorageKey(slug));
    setGuestMode(false);
  }, [slug]);

  useEffect(() => {
    if (guestMode && !auth.isAuthenticated && activeTab === "account") {
      setActiveTab("book");
    }
  }, [guestMode, auth.isAuthenticated, activeTab]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingOffice(true);
    setOfficeError(false);

    const loadOffice = async () => {
      try {
        if (routeSlug) {
          const r = await fetch(`/api/public/office/${routeSlug}`);
          if (!r.ok) throw new Error();
          const data = await r.json();
          if (cancelled) return;
          setSlug(routeSlug);
          setOffice(data);
          return;
        }

        const r = await fetch("/api/public/booking-office");
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (cancelled) return;
        setSlug(data.slug);
        setOffice({
          id: data.id,
          name: data.name,
          city: data.city,
          state: data.state,
          phone: data.phone,
          email: data.email,
        });
      } catch {
        if (!cancelled) setOfficeError(true);
      } finally {
        if (!cancelled) setIsLoadingOffice(false);
      }
    };

    loadOffice();
    return () => {
      cancelled = true;
    };
  }, [routeSlug]);

  useEffect(() => {
    if (!slug || !office) return;
    fetch(`/api/public/office/${slug}/partners`)
      .then((r) => r.json())
      .then((data) => setPartners(data))
      .catch(() => {});
  }, [slug, office]);

  if (isLoadingOffice || auth.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (officeError || !office) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="flex items-center gap-3">
              <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-md" />
              <span className="text-xl font-semibold">XGoo</span>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Booking Unavailable</h1>
          <p className="text-muted-foreground">Parcel booking is not set up yet. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!auth.isAuthenticated && !guestMode ? (
        <>
          <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="mx-auto max-w-3xl px-4 py-3">
              <div className="flex items-center gap-3">
                <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-md" />
                <span className="text-lg font-semibold">XGoo</span>
              </div>
            </div>
          </header>
          <AuthPage slug={slug} office={office} onLogin={auth.login} onContinueAsGuest={enterGuestMode} />
        </>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen">
          <div className="sticky top-0 z-[100] border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
            <div className="mx-auto max-w-3xl px-4 py-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-md" />
                  <div>
                    <span className="text-lg font-semibold">XGoo</span>
                    <span className="text-muted-foreground text-sm ml-2 hidden sm:inline">| Courier Booking</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {office.phone && (
                    <a href={`tel:${office.phone}`} className="text-sm text-primary hover:underline hidden sm:block" data-testid="link-office-phone">
                      {office.phone}
                    </a>
                  )}
                  {guestMode && !auth.isAuthenticated && (
                    <>
                      <span className="text-xs text-muted-foreground rounded-md border px-2 py-1" data-testid="badge-guest">
                        Guest
                      </span>
                      <Button variant="outline" size="sm" onClick={exitGuestMode} data-testid="button-guest-sign-in">
                        Sign in
                      </Button>
                    </>
                  )}
                  {auth.isAuthenticated && (
                    <span className="text-sm text-muted-foreground" data-testid="text-welcome-user">
                      <UserCircle className="h-4 w-4 inline mr-1" />
                      {auth.user?.name}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1 sm:hidden">Courier Booking</p>
            </div>
            <div className="mx-auto max-w-3xl px-4 pb-3">
              <TabsList
                className={`grid w-full ${guestMode && !auth.isAuthenticated ? "grid-cols-3" : "grid-cols-4"}`}
                data-testid="tabs-navigation"
              >
                <TabsTrigger value="book" data-testid="tab-book">
                  <Plus className="h-4 w-4 mr-1 hidden sm:block" /> Book
                </TabsTrigger>
                <TabsTrigger value="bookings" data-testid="tab-bookings">
                  <ClipboardList className="h-4 w-4 mr-1 hidden sm:block" /> My Bookings
                </TabsTrigger>
                <TabsTrigger value="track" data-testid="tab-track">
                  <Search className="h-4 w-4 mr-1 hidden sm:block" /> Track
                </TabsTrigger>
                {!(guestMode && !auth.isAuthenticated) && (
                  <TabsTrigger value="account" data-testid="tab-account">
                    <UserCircle className="h-4 w-4 mr-1 hidden sm:block" /> Account
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
          </div>

          <main className="mx-auto max-w-3xl px-4 pt-4">
            <TabsContent value="book" className="mt-0">
              {guestMode && !auth.isAuthenticated ? (
                <BookingTab
                  slug={slug}
                  partners={partners}
                  guestMode
                  onGuestBookingSaved={() => setGuestBookingsTick((t) => t + 1)}
                />
              ) : (
                <BookingTab
                  slug={slug}
                  partners={partners}
                  token={auth.token!}
                  user={auth.user!}
                />
              )}
            </TabsContent>
            <TabsContent value="bookings" className="mt-0">
              {guestMode && !auth.isAuthenticated ? (
                <GuestBookingsTab slug={slug} refreshTick={guestBookingsTick} />
              ) : (
                <MyBookingsTab token={auth.token!} />
              )}
            </TabsContent>
            <TabsContent value="track" className="mt-0">
              <TrackTab slug={slug} />
            </TabsContent>
            {!(guestMode && !auth.isAuthenticated) && (
              <TabsContent value="account" className="mt-0">
                <AccountTab
                  token={auth.token!}
                  user={auth.user!}
                  onUserUpdate={(u) => {
                    auth.setUser(u);
                    localStorage.setItem(`xgoo_customer_user_${slug}`, JSON.stringify(u));
                  }}
                  onLogout={auth.logout}
                />
              </TabsContent>
            )}
          </main>
        </Tabs>
      )}
    </div>
  );
}

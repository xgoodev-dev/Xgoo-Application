import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { Link, useParams, useLocation, useSearch } from "wouter";
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
  ClipboardList,
  Search,
  Clock,
  ArrowLeft,
  Navigation,
  UserCircle,
  Plus,
  Eye,
  LocateFixed,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { ProductAttribution } from "@/components/marketing/ProductAttribution";
import { TechPartnerCredit } from "@/components/marketing/TechPartnerCredit";
import { XGOO_BRAND, XGOO_MODULES, XGOO_OPS_MODULES } from "@/components/marketing/site-info";
import { PageSeo } from "@/components/seo/PageSeo";
import { SEO_PAGES } from "@/lib/seo";
import { trackMetaLead } from "@/lib/meta-pixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressPicker, SavedAddressesManager, saveAddressFromBooking, suggestAddressLabel } from "@/components/customer/SavedAddresses";
import type { SavedAddressValue } from "@/components/customer/SavedAddresses";
import { BookingTrackingPanel } from "@/components/customer/BookingTrackingPanel";
import {
  CustomerAuthShell,
  customerAuthFieldClass,
  customerAuthPrimaryButtonClass,
  customerAuthSecondaryButtonClass,
  customerAuthGoogleButtonClass,
} from "@/components/customer/CustomerAuthShell";
import { CustomerPortalShell } from "@/components/customer/CustomerPortalShell";
import { GoHome } from "@/components/customer/go/GoHome";
import { GoProfile, type GoProfileView } from "@/components/customer/go/GoProfile";
import {
  BusinessOnboarding,
  DestinationsPanel,
  SchedulePanel,
  TodayDispatch,
} from "@/components/customer/business/BusinessWorkspace";
import { ProHome } from "@/components/customer/business/ProHome";
import { businessApi } from "@/components/customer/business/business-api";
import { isBusinessProfileReady } from "@shared/business-courier";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TrackingLoadsWorkspace,
  loadProgressFromStatus,
  type LoadDetail,
  type LoadItem,
} from "@/components/customer/TrackingLoadsWorkspace";
import {
  BookShipmentWorkspace,
  type AddressScope,
  type BookFlowStep,
  type ShipmentMapPoint,
} from "@/components/customer/BookShipmentWorkspace";
import { buildCustomerTracking, type CustomerTrackingView } from "@shared/customer-tracking";
import {
  DEFAULT_PICKUP_SETTINGS,
  enabledPickupSlots,
  mergePickupSettings,
  pickupSlotLabel,
  type PickupSettings,
} from "@shared/pickup-settings";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabase";
import { CUSTOMER_GOOGLE_OAUTH_KEY } from "@/lib/customer-google-oauth";
import { cn } from "@/lib/utils";

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
  phone?: string | null;
  email?: string | null;
  accountType?: "individual" | "business" | null;
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
  pickupLat?: string | null;
  pickupLng?: string | null;
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

const FALLBACK_PICKUP_SLOTS = enabledPickupSlots(DEFAULT_PICKUP_SETTINGS);

function guestBookingsStorageKey(slug: string) {
  return `xgoo_guest_bookings_${slug}`;
}

async function fetchJsonWithRetry(url: string, attempts = 3): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    last = res;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
    }
  }
  return last ?? new Response(null, { status: 503 });
}

function guestModeStorageKey(slug: string) {
  return `xgoo_guest_mode_${slug}`;
}

function wantsCustomerAuthScreen(search = "") {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return (
    params.get("mode") === "login" ||
    params.get("mode") === "register" ||
    params.get("oauth") === "1" ||
    params.has("code")
  );
}

function clearCustomerOAuthParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("oauth");
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
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
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  otp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your mobile number or email"),
  password: z.string().optional(),
  otp: z.string().optional(),
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
  senderCity: requiredText("Sender city"),
  senderState: requiredText("Sender state"),
  senderPincode: requiredText("Sender pincode"),
  receiverName: requiredText("Receiver name"),
  receiverPhone: phoneText("Receiver phone"),
  receiverAddress: requiredText("Receiver address"),
  receiverCity: requiredText("Receiver city"),
  receiverState: requiredText("Receiver state"),
  receiverPincode: requiredText("Receiver pincode"),
  weight: z.preprocess(
    toFormString,
    z
      .string()
      .trim()
      .min(1, "Weight is required")
      .refine((v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0;
      }, "Enter a valid weight greater than 0"),
  ),
  numberOfPieces: z.preprocess(
    (val) => {
      const s = toFormString(val).trim();
      return s;
    },
    z
      .string()
      .min(1, "Number of pieces is required")
      .refine((v) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) && n >= 1;
      }, "Enter at least 1 piece"),
  ),
  contentDescription: requiredText("Package contents"),
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

function CustomerBookingFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="mx-auto max-w-3xl px-4 py-4 flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
          <ProductAttribution />
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
            <a href="/terms" className="hover:text-foreground hover:underline">
              Terms
            </a>
            <a href="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </a>
            <a href="/return-policy" className="hover:text-foreground hover:underline">
              Returns
            </a>
            {XGOO_OPS_MODULES.map((module) => (
              <a
                key={module.id}
                href={module.path}
                className="hover:text-foreground hover:underline"
                data-testid={`link-footer-${module.id}`}
              >
                {module.name}
              </a>
            ))}
          </div>
        </div>
        <TechPartnerCredit />
      </div>
    </footer>
  );
}

function CustomerBookingHeader({ showBack = false }: { showBack?: boolean }) {
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="shrink-0 -ml-2 rounded-none"
                data-testid="button-back-to-home"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            )}
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 object-contain shrink-0" />
            <div className="min-w-0">
              <span className="text-lg font-extrabold tracking-tight text-[#FF4907] block leading-none">
                {XGOO_BRAND.productName}
              </span>
              <span className="text-[11px] text-zinc-400 block truncate">
                from {XGOO_BRAND.parentCompany}
                <span className="hidden sm:inline"> · Book a Parcel</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function AccountKindTabs({
  value,
  onChange,
}: {
  value: "individual" | "business";
  onChange: (value: "individual" | "business") => void;
}) {
  return (
    <div className="mb-6 grid grid-cols-2 border border-stone-200">
      {([
        { id: "individual" as const, label: XGOO_MODULES.go.name },
        { id: "business" as const, label: XGOO_MODULES.pro.name },
      ]).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "h-11 text-sm font-semibold",
            value === tab.id ? "bg-[#FF4907] text-white" : "bg-white text-stone-600 hover:bg-stone-50",
          )}
          data-testid={`button-auth-kind-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function explicitAccountKind(search = ""): "individual" | "business" | null {
  const account = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("account");
  if (account === "business" || account === "pro") return "business";
  if (account === "individual" || account === "go") return "individual";
  return null;
}

function accountKindFromSearch(search = ""): "individual" | "business" {
  return explicitAccountKind(search) ?? "individual";
}

function persistCustomerModule(kind: "individual" | "business") {
  const url = new URL(window.location.href);
  url.searchParams.set("account", kind === "business" ? "pro" : "go");
  url.searchParams.delete("mode");
  url.searchParams.delete("oauth");
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function isBusinessAccount(user?: CustomerUserInfo | null) {
  return user?.accountType === "business";
}

async function sendCustomerOtpRequest(slug: string, phone: string, purpose: "login" | "register") {
  const res = await fetch(`/api/public/office/${slug}/customer/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, purpose }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Could not send OTP");
  return result as { debugOtp?: string; expiresInSec?: number };
}

function CustomerGoogleSignIn({
  slug,
  disabled,
  buttonLabel = "Continue with Google",
  dividerLabel = "or continue with email or phone",
}: {
  slug: string;
  disabled?: boolean;
  buttonLabel?: string;
  dividerLabel?: string;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    try {
      sessionStorage.setItem(CUSTOMER_GOOGLE_OAUTH_KEY, slug);
      const path = window.location.pathname.startsWith("/book") ? window.location.pathname : "/book";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${path}?oauth=1&account=pro`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        sessionStorage.removeItem(CUSTOMER_GOOGLE_OAUTH_KEY);
        toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      }
    } catch (error: unknown) {
      sessionStorage.removeItem(CUSTOMER_GOOGLE_OAUTH_KEY);
      toast({
        title: "Google sign-in failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || busy}
        onClick={handleGoogle}
        className={customerAuthGoogleButtonClass}
        data-testid="button-google-auth"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FcGoogle className="h-5 w-5" />}
        {buttonLabel}
      </Button>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-stone-400">{dividerLabel}</span>
        </div>
      </div>
    </>
  );
}

function GuestContinue({
  onContinueAsGuest,
  testId,
}: {
  onContinueAsGuest?: () => void;
  testId: string;
}) {
  if (!onContinueAsGuest) return null;
  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="outline"
        className={customerAuthSecondaryButtonClass}
        onClick={onContinueAsGuest}
        data-testid={testId}
      >
        Continue as guest
      </Button>
      <p className="mt-2 text-center text-xs text-stone-400">
        Guests can book a pickup once. After booking, sign in with mobile OTP to track it.
      </p>
    </div>
  );
}

function LoginForm({
  slug,
  office,
  kind,
  onKindChange,
  onLogin,
  onToggle,
  onContinueAsGuest,
}: {
  slug: string;
  office: OfficeInfo;
  kind: "individual" | "business";
  onKindChange: (value: "individual" | "business") => void;
  onLogin: (user: CustomerUserInfo, token: string) => void;
  onToggle: () => void;
  onContinueAsGuest?: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", otp: "" },
  });

  async function handleSendOtp() {
    const phone = form.getValues("identifier");
    setOtpSending(true);
    try {
      const result = await sendCustomerOtpRequest(slug, phone, "login");
      toast({
        title: "OTP sent",
        description: result.debugOtp
          ? `Use ${result.debugOtp} to sign in (test mode).`
          : "Enter the code sent to your mobile number.",
      });
    } catch (err: any) {
      toast({ title: "Could not send OTP", description: err.message, variant: "destructive" });
    } finally {
      setOtpSending(false);
    }
  }

  async function handleLogin(data: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      const identifier = data.identifier.trim();
      const payload = {
        accountType: kind,
        ...(identifier.includes("@")
          ? { email: identifier, password: data.password }
          : kind === "individual"
            ? { phone: identifier, otp: data.otp }
            : { phone: identifier, password: data.password }),
      };
      const res = await fetch(`/api/public/office/${slug}/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      persistCustomerModule(kind);
      onLogin(result.user, result.token);
      toast({ title: "Welcome back!", description: `Logged in as ${result.user.name}` });
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CustomerAuthShell
      title="Sign In"
      subtitle={
        kind === "individual"
          ? `${XGOO_MODULES.go.meaning}. Sign in with your mobile number and OTP.`
          : `${XGOO_MODULES.pro.meaning}. Sign in with Google, email, or phone.`
      }
      officeName={office.name}
    >
      <h2 className="sr-only" data-testid="text-auth-title">
        Welcome Back
      </h2>
      <AccountKindTabs value={kind} onChange={onKindChange} />
      {kind === "business" ? (
        <CustomerGoogleSignIn
          slug={slug}
          disabled={isSubmitting}
          buttonLabel="Sign in with Google"
          dividerLabel="or sign in with email or phone"
        />
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">{kind === "individual" ? "Mobile number" : "Email or phone"}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={kind === "individual" ? "Mobile number" : "Email or phone number"}
                    autoComplete={kind === "individual" ? "tel" : "username"}
                    className={customerAuthFieldClass}
                    data-testid="input-login-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {kind === "individual" ? (
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">OTP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="6-digit OTP"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className={customerAuthFieldClass}
                        data-testid="input-login-otp"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                className="h-[52px] rounded-none"
                disabled={otpSending}
                onClick={handleSendOtp}
                data-testid="button-send-login-otp"
              >
                {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
            </div>
          ) : (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      className={customerAuthFieldClass}
                      data-testid="input-login-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <p className="text-center text-sm text-stone-600 pt-2">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onToggle}
              className="font-semibold text-[#FF4907] hover:underline"
              data-testid="button-toggle-auth-mode"
            >
              Sign up
            </button>
          </p>
          <Button
            type="submit"
            className={customerAuthPrimaryButtonClass}
            disabled={isSubmitting}
            data-testid="button-login"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {kind === "individual" ? "Verify OTP" : "Log In"}
          </Button>
        </form>
      </Form>
      <GuestContinue
        onContinueAsGuest={kind === "individual" ? onContinueAsGuest : undefined}
        testId="button-continue-as-guest"
      />
    </CustomerAuthShell>
  );
}

function RegisterForm({
  slug,
  office,
  kind,
  onKindChange,
  onLogin,
  onToggle,
  onContinueAsGuest,
}: {
  slug: string;
  office: OfficeInfo;
  kind: "individual" | "business";
  onKindChange: (value: "individual" | "business") => void;
  onLogin: (user: CustomerUserInfo, token: string) => void;
  onToggle: () => void;
  onContinueAsGuest?: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "", email: "", password: "", otp: "", address: "", city: "", state: "", pincode: "" },
  });

  async function handleSendOtp() {
    const phone = form.getValues("phone");
    setOtpSending(true);
    try {
      const result = await sendCustomerOtpRequest(slug, phone, "register");
      toast({
        title: "OTP sent",
        description: result.debugOtp
          ? `Use ${result.debugOtp} to create your account (test mode).`
          : "Enter the code sent to your mobile number.",
      });
    } catch (err: any) {
      toast({ title: "Could not send OTP", description: err.message, variant: "destructive" });
    } finally {
      setOtpSending(false);
    }
  }

  async function handleRegister(data: z.infer<typeof registerSchema>) {
    if (kind === "individual" && !data.otp?.trim()) {
      toast({ title: "OTP required", description: "Send and enter the OTP from your mobile number.", variant: "destructive" });
      return;
    }
    if (kind === "business" && (!data.email || !data.password || data.password.length < 6)) {
      toast({ title: "XGoo Pro details needed", description: "Enter a work email and a password of at least 6 characters.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/public/office/${slug}/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          accountType: kind,
          ...(kind === "individual" ? { password: undefined } : { otp: undefined }),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      persistCustomerModule(kind);
      onLogin(result.user, result.token);
      toast({ title: "Account Created!", description: `Welcome, ${result.user.name}` });
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CustomerAuthShell
      title="Create account"
      subtitle={
        kind === "individual"
          ? `${XGOO_MODULES.go.meaning}. Create an account with your mobile number and OTP, or book a pickup first.`
          : `${XGOO_MODULES.pro.meaning}. Sign up with Google, work email, or phone.`
      }
      officeName={office.name}
    >
      <h2 className="sr-only" data-testid="text-auth-title">
        Create Account
      </h2>
      <AccountKindTabs value={kind} onChange={onKindChange} />
      {kind === "business" ? (
        <CustomerGoogleSignIn
          slug={slug}
          disabled={isSubmitting}
          buttonLabel="Sign up with Google"
          dividerLabel="or sign up with email or phone"
        />
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Full name *"
                    autoComplete="name"
                    className={customerAuthFieldClass}
                    data-testid="input-register-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Phone *"
                      autoComplete="tel"
                      className={customerAuthFieldClass}
                      data-testid="input-register-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={kind === "business" ? "Work email *" : "Email (optional)"}
                      autoComplete="email"
                      className={customerAuthFieldClass}
                      data-testid="input-register-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {kind === "individual" ? (
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">OTP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="6-digit OTP"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className={customerAuthFieldClass}
                        data-testid="input-register-otp"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                className="h-[52px] rounded-none"
                disabled={otpSending}
                onClick={handleSendOtp}
                data-testid="button-send-register-otp"
              >
                {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
            </div>
          ) : (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Password (min 6 characters) *"
                      autoComplete="new-password"
                      className={customerAuthFieldClass}
                      data-testid="input-register-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Pickup address (optional)"
                    className={customerAuthFieldClass}
                    data-testid="input-register-address"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="City" className={customerAuthFieldClass} data-testid="input-register-city" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="State" className={customerAuthFieldClass} data-testid="input-register-state" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Pincode" className={customerAuthFieldClass} data-testid="input-register-pincode" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <p className="text-center text-sm text-stone-600 pt-2">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onToggle}
              className="font-semibold text-[#FF4907] hover:underline"
              data-testid="button-toggle-auth-mode"
            >
              Sign in
            </button>
          </p>
          <Button
            type="submit"
            className={customerAuthPrimaryButtonClass}
            disabled={isSubmitting}
            data-testid="button-register"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>
      </Form>
      <GuestContinue
        onContinueAsGuest={kind === "individual" ? onContinueAsGuest : undefined}
        testId="button-continue-as-guest-register"
      />
    </CustomerAuthShell>
  );
}

function AuthPage({ slug, office, onLogin, onContinueAsGuest }: {
  slug: string;
  office: OfficeInfo;
  onLogin: (user: CustomerUserInfo, token: string) => void;
  onContinueAsGuest?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">(() => {
    if (typeof window === "undefined") return "login";
    const m = new URLSearchParams(window.location.search).get("mode");
    return m === "register" ? "register" : "login";
  });
  const [kind, setKind] = useState<"individual" | "business">(() => {
    if (typeof window === "undefined") return "individual";
    return accountKindFromSearch(window.location.search);
  });
  const toggle = useCallback(() => setMode((m) => (m === "login" ? "register" : "login")), []);
  const handleKindChange = useCallback((value: "individual" | "business") => {
    setKind(value);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", mode);
    url.searchParams.set("account", value === "business" ? "pro" : "go");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [mode]);

  if (mode === "register") {
    return (
      <RegisterForm
        slug={slug}
        office={office}
        kind={kind}
        onKindChange={handleKindChange}
        onLogin={onLogin}
        onToggle={toggle}
        onContinueAsGuest={onContinueAsGuest}
      />
    );
  }
  return (
    <LoginForm
      slug={slug}
      office={office}
      kind={kind}
      onKindChange={handleKindChange}
      onLogin={onLogin}
      onToggle={toggle}
      onContinueAsGuest={onContinueAsGuest}
    />
  );
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
  const [submitted, setSubmitted] = useState<{
    requestNumber: string;
    whatsappReturnUrl?: string;
  } | null>(null);
  const [cameFromWhatsApp] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("from") === "whatsapp";
  });
  const [pickupPoint, setPickupPoint] = useState<ShipmentMapPoint | null>(() => {
    if (user?.defaultPickupLat && user?.defaultPickupLng) {
      const lat = parseFloat(user.defaultPickupLat);
      const lng = parseFloat(user.defaultPickupLng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return {
          lat,
          lng,
          label: user.address || "Saved pickup location",
          address: user.address || undefined,
          city: user.city || undefined,
          state: user.state || undefined,
          pincode: user.pincode || undefined,
        };
      }
    }
    return null;
  });
  const [destinationPoint, setDestinationPoint] = useState<ShipmentMapPoint | null>(null);
  const [addressScope, setAddressScope] = useState<AddressScope>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("scope") === "international" ? "international" : "domestic";
  });
  const [bookStep, setBookStep] = useState<BookFlowStep>("pickup");
  const [returnToReview, setReturnToReview] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const [detailsAcknowledged, setDetailsAcknowledged] = useState(false);
  const [pickupSettings, setPickupSettings] = useState<PickupSettings>(DEFAULT_PICKUP_SETTINGS);
  const pickupSlots = enabledPickupSlots(pickupSettings);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/office/${encodeURIComponent(slug)}/pickup-settings`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setPickupSettings(mergePickupSettings(data));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const pickupLocation = pickupPoint
    ? { lat: pickupPoint.lat, lng: pickupPoint.lng, name: pickupPoint.label }
    : null;
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
      pickupTimeSlot: FALLBACK_PICKUP_SLOTS[0]?.value || "09:00",
    },
  });

  useEffect(() => {
    if (!pickupSlots.length) return;
    const current = form.getValues("pickupTimeSlot");
    if (!pickupSlots.some((slot) => slot.value === current)) {
      form.setValue("pickupTimeSlot", pickupSlots[0].value);
    }
  }, [pickupSlots, form]);

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

  function applyPickupPoint(point: ShipmentMapPoint) {
    setPickupPoint(point);
    form.setValue("senderAddress", point.address || point.label, { shouldValidate: true });
    form.setValue("senderCity", point.city || "", { shouldValidate: true });
    form.setValue("senderState", point.state || "", { shouldValidate: true });
    form.setValue("senderPincode", point.pincode || "", { shouldValidate: true });
  }

  function applyDestinationPoint(point: ShipmentMapPoint) {
    setDestinationPoint(point);
    const base = point.address || point.label;
    const withCountry =
      addressScope === "international" && point.country && !base.toLowerCase().includes(point.country.toLowerCase())
        ? `${base}, ${point.country}`
        : base;
    form.setValue("receiverAddress", withCountry, { shouldValidate: true });
    form.setValue("receiverCity", point.city || "", { shouldValidate: true });
    form.setValue("receiverState", point.state || "", { shouldValidate: true });
    form.setValue("receiverPincode", point.pincode || "", { shouldValidate: true });
  }

  function applySavedAddress(prefix: "sender" | "receiver", addr: SavedAddressValue) {
    form.setValue(`${prefix}Name` as any, addr.name);
    form.setValue(`${prefix}Phone` as any, addr.phone);
    form.setValue(`${prefix}Address` as any, addr.address);
    if (addr.city) form.setValue(`${prefix}City` as any, addr.city);
    if (addr.state) form.setValue(`${prefix}State` as any, addr.state);
    if (addr.pincode) form.setValue(`${prefix}Pincode` as any, addr.pincode);
    if (prefix === "sender" && addr.lat && addr.lng) {
      applyPickupPoint({
        lat: parseFloat(addr.lat),
        lng: parseFloat(addr.lng),
        label: addr.address,
        address: addr.address,
        city: addr.city || undefined,
        state: addr.state || undefined,
        pincode: addr.pincode || undefined,
      });
    }
    if (prefix === "receiver" && addr.lat && addr.lng) {
      applyDestinationPoint({
        lat: parseFloat(addr.lat),
        lng: parseFloat(addr.lng),
        label: addr.address,
        address: addr.address,
        city: addr.city || undefined,
        state: addr.state || undefined,
        pincode: addr.pincode || undefined,
      });
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
    weight: "Weight",
    numberOfPieces: "Number of pieces",
    contentDescription: "Package contents",
    serviceType: "Service type",
  };

  const FIELD_TEST_IDS: Record<string, string> = {
    senderName: "input-sender-name",
    senderPhone: "input-sender-phone",
    senderEmail: "input-sender-email",
    senderAddress: "input-sender-address",
    senderCity: "input-sender-city",
    senderState: "input-sender-state",
    senderPincode: "input-sender-pincode",
    receiverName: "input-receiver-name",
    receiverPhone: "input-receiver-phone",
    receiverAddress: "input-receiver-address",
    receiverCity: "input-receiver-city",
    receiverState: "input-receiver-state",
    receiverPincode: "input-receiver-pincode",
    pickupDate: "input-pickup-date",
    pickupTimeSlot: "select-pickup-time",
    numberOfPieces: "input-pieces",
    weight: "input-weight",
    contentDescription: "input-content",
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

    const firstField = flat[0]?.field || "";
    const pickupFields = new Set(["senderAddress", "senderCity", "senderState", "senderPincode"]);
    const dropFields = new Set(["receiverAddress", "receiverCity", "receiverState", "receiverPincode"]);
    const packageFields = new Set([
      "weight",
      "numberOfPieces",
      "contentDescription",
      "serviceType",
      "declaredValue",
      "notes",
      "courierPreference",
    ]);

    if (!pickupPoint || pickupFields.has(firstField)) setBookStep("pickup");
    else if (!destinationPoint || dropFields.has(firstField)) setBookStep("destination");
    else if (packageFields.has(firstField)) setBookStep("package");
    else setBookStep("details");

    const first = flat[0];
    const testId = first ? FIELD_TEST_IDS[first.field] : null;
    requestAnimationFrame(() => {
      const el =
        (testId && document.querySelector(`[data-testid="${testId}"]`)) ||
        document.querySelector("[aria-invalid='true']");
      if (el && "scrollIntoView" in el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if ("focus" in el && typeof el.focus === "function") {
          (el as HTMLElement).focus();
        }
      }
    });
  }

  async function placeBooking() {
    if (bookStep !== "review") {
      toast({
        title: "Review required",
        description: "Please review your booking details before confirming.",
        variant: "destructive",
      });
      return;
    }
    if (!detailsAcknowledged) {
      toast({
        title: "Confirm details",
        description: "Please confirm that the booking details are correct.",
        variant: "destructive",
      });
      return;
    }

    const ok = await form.trigger();
    if (!ok) {
      toast({
        title: "Please check the form",
        description: "Some required booking details are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    const data = form.getValues();

    if (!pickupPoint) {
      toast({
        title: "Pickup location needed",
        description: "Search or drop a pickup pin on the map.",
        variant: "destructive",
      });
      setBookStep("pickup");
      return;
    }
    if (!destinationPoint) {
      toast({
        title: "Destination needed",
        description: "Search or drop a destination pin on the map.",
        variant: "destructive",
      });
      setBookStep("destination");
      return;
    }
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
        setSubmitted({
          requestNumber: result.requestNumber,
          whatsappReturnUrl: result.whatsappReturnUrl,
        });
        trackMetaLead({ content_category: slug || "public" });
        setPackagePhotos([]);
        toast({
          title: "Booking Submitted!",
          description: result.accountCreated
            ? `Request #${result.requestNumber} is in. Your account is ready — sign in with this mobile number and OTP.`
            : `Request #${result.requestNumber} is in. Sign in with your mobile number and OTP to track it.`,
        });
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
            label: suggestAddressLabel({
              city: data.senderCity,
              address: data.senderAddress,
              name: data.senderName,
              fallback: "Pickup",
            }),
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
            label: suggestAddressLabel({
              city: data.receiverCity,
              address: data.receiverAddress,
              name: data.receiverName,
              fallback: "Delivery",
            }),
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
      setSubmitted({
        requestNumber: result.requestNumber,
        whatsappReturnUrl: result.whatsappReturnUrl,
      });
      trackMetaLead({ content_category: slug || "public" });
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
      <div className="flex h-full items-center justify-center overflow-y-auto p-6">
        <div className="mx-auto max-w-lg w-full">
        <div className="border border-stone-200 bg-white p-8 text-center rounded-2xl shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-[#FF4907]/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-[#FF4907]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight" data-testid="text-booking-success">
            Booking request submitted
          </h2>
          <p className="text-stone-500 mb-6 text-sm">
            Our team will confirm your pickup shortly. Save your request number to track status.
          </p>
          <div className="bg-[#f5f3f2] p-4 mb-6">
            <p className="text-sm text-stone-500 mb-1">Request Number</p>
            <p className="text-2xl font-mono font-bold text-[#FF4907]" data-testid="text-booking-request-number">
              {submitted.requestNumber}
            </p>
          </div>
          {submitted.whatsappReturnUrl && (
            <div className="mb-6 space-y-2">
              <p className="text-sm text-stone-500">
                {cameFromWhatsApp
                  ? "Return to WhatsApp to get your booking details in chat."
                  : "Open WhatsApp to receive updates about this booking."}
              </p>
              <Button asChild className="w-full rounded-none bg-green-600 hover:bg-green-700">
                <a
                  href={submitted.whatsappReturnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="button-return-whatsapp"
                >
                  Open WhatsApp
                </a>
              </Button>
            </div>
          )}
          <p className="text-xs text-stone-400 mb-4">
            A confirmation message will be sent to your phone if WhatsApp automation is enabled.
          </p>
          <Button
            variant="outline"
            className="rounded-none w-full sm:w-auto"
            onClick={() => {
              setSubmitted(null);
              form.reset({
                ...form.getValues(),
                receiverName: "",
                receiverPhone: "",
                receiverAddress: "",
                receiverCity: "",
                receiverState: "",
                receiverPincode: "",
                weight: "",
                contentDescription: "",
                declaredValue: "",
                notes: "",
              });
              setPickupPoint(null);
              setDestinationPoint(null);
              setReturnToReview(false);
              setDetailsAcknowledged(false);
              setConfirmReady(false);
              setBookStep("pickup");
            }}
            data-testid="button-book-another"
          >
            Book Another Shipment
          </Button>
        </div>
        </div>
      </div>
    );
  }


  const STEP_ORDER: BookFlowStep[] = ["pickup", "destination", "details", "package", "review"];

  function editFromReview(step: BookFlowStep) {
    setReturnToReview(true);
    setBookStep(step);
  }

  async function goNextBookStep() {
    if (bookStep === "pickup") {
      if (!pickupPoint) {
        toast({
          title: "Set pickup first",
          description: "Search or tap the map to place the pickup pin.",
          variant: "destructive",
        });
        return;
      }
      const ok = await form.trigger(["senderAddress", "senderCity", "senderState", "senderPincode"]);
      if (!ok) {
        toast({
          title: "Complete pickup address",
          description: "Fill in the address details below the map pin.",
          variant: "destructive",
        });
        return;
      }
      if (returnToReview) {
        setReturnToReview(false);
        setBookStep("review");
        return;
      }
      setBookStep("destination");
      return;
    }
    if (bookStep === "destination") {
      if (!destinationPoint) {
        toast({
          title: "Set destination",
          description: "Search or tap the map to place the drop pin.",
          variant: "destructive",
        });
        return;
      }
      const ok = await form.trigger(["receiverAddress", "receiverCity", "receiverState", "receiverPincode"]);
      if (!ok) {
        toast({
          title: "Complete delivery address",
          description: "Fill in the destination address details below.",
          variant: "destructive",
        });
        return;
      }
      if (returnToReview) {
        setReturnToReview(false);
        setBookStep("review");
        return;
      }
      setBookStep("details");
      return;
    }
    if (bookStep === "details") {
      const ok = await form.trigger([
        "pickupDate",
        "pickupTimeSlot",
        "senderName",
        "senderPhone",
        "senderAddress",
        "receiverName",
        "receiverPhone",
        "receiverAddress",
      ]);
      if (!ok) return;
      if (returnToReview) {
        setReturnToReview(false);
        setBookStep("review");
        return;
      }
      setBookStep("package");
      return;
    }
    if (bookStep === "package") {
      const ok = await form.trigger([
        "weight",
        "numberOfPieces",
        "contentDescription",
        "serviceType",
      ]);
      if (!ok) {
        toast({
          title: "Complete package details",
          description: "Weight, pieces, contents, and service type are required.",
          variant: "destructive",
        });
        return;
      }
      setReturnToReview(false);
      setDetailsAcknowledged(false);
      setConfirmReady(false);
      setBookStep("review");
    }
  }

  function goBackBookStep() {
    if (returnToReview) {
      setReturnToReview(false);
      setBookStep("review");
      return;
    }
    const i = STEP_ORDER.indexOf(bookStep);
    if (i > 0) setBookStep(STEP_ORDER[i - 1]);
  }

  useEffect(() => {
    if (bookStep !== "review") {
      setConfirmReady(false);
      return;
    }
    setDetailsAcknowledged(false);
    setConfirmReady(false);
    // Prevent accidental double-click from Package → Confirm landing on the same button
    const t = window.setTimeout(() => setConfirmReady(true), 700);
    return () => window.clearTimeout(t);
  }, [bookStep]);

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          // Never place a booking via native form submit / Enter — only via Confirm button
          e.preventDefault();
          if (bookStep !== "review") {
            void goNextBookStep();
          }
        }}
        className="h-full min-h-0"
        data-testid="book-shipment-form"
      >
        <input type="file" ref={cameraRef} accept="image/*" capture="environment" className="hidden" onChange={handleCameraScan} data-testid="input-camera-scan" />
        <input type="file" ref={photoUploadRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} data-testid="input-photo-upload" />

        <BookShipmentWorkspace
          step={bookStep}
          onStepChange={(s) => {
            if (bookStep === "review" && s !== "review") setReturnToReview(true);
            if (s === "review") setReturnToReview(false);
            setBookStep(s);
          }}
          scope={addressScope}
          onScopeChange={setAddressScope}
          pickup={pickupPoint}
          destination={destinationPoint}
          onPickupChange={applyPickupPoint}
          onDestinationChange={applyDestinationPoint}
          onContinue={goNextBookStep}
          onBack={goBackBookStep}
          continueLabel={
            returnToReview ? "Save & review" : bookStep === "package" ? "Review booking" : "Continue"
          }
          showSubmit={bookStep === "review"}
          submitLabel="Confirm & place booking"
          onConfirm={placeBooking}
          confirmDisabled={!confirmReady || !detailsAcknowledged}
          isSubmitting={isSubmitting}
          continueDisabled={
            (bookStep === "pickup" && !pickupPoint) || (bookStep === "destination" && !destinationPoint)
          }
        >
          {bookStep === "pickup" && (
            <div className="space-y-4">
              {!pickupPoint ? (
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Search or tap the map to set pickup. You can edit full address details after the pin is placed.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">Pickup address details</h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Review and edit what the map filled in — house no., street, landmark, etc.
                    </p>
                  </div>
                  <FormField control={form.control} name="senderAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street / building / area *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="resize-none rounded-xl"
                          placeholder="House / flat no., street, landmark"
                          data-testid="input-sender-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid gap-3 grid-cols-2">
                    <FormField control={form.control} name="senderCity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl" placeholder="City" data-testid="input-sender-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="senderState" render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl" placeholder="State" data-testid="input-sender-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="senderPincode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode *</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl" placeholder="6-digit pincode" inputMode="numeric" data-testid="input-sender-pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <p className="text-[11px] text-zinc-400">
                    Map pin: {pickupPoint.lat.toFixed(5)}, {pickupPoint.lng.toFixed(5)} — drag the pin to refine.
                  </p>
                </div>
              )}
            </div>
          )}

          {bookStep === "destination" && (
            <div className="space-y-4">
              {!destinationPoint ? (
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Search or tap the map to set delivery
                  {addressScope === "international" ? " (international addresses supported)" : ""}
                  . You can edit full address details after the pin is placed.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Delivery address details
                      {addressScope === "international" ? " (International)" : ""}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Edit door number, street, and locality so the courier can find it easily.
                    </p>
                  </div>
                  <FormField control={form.control} name="receiverAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street / building / area *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="resize-none rounded-xl"
                          placeholder="House / flat no., street, landmark"
                          data-testid="input-receiver-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid gap-3 grid-cols-2">
                    <FormField control={form.control} name="receiverCity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl" placeholder="City" data-testid="input-receiver-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="receiverState" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{addressScope === "international" ? "State / Region *" : "State *"}</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-xl" placeholder={addressScope === "international" ? "State / province" : "State"} data-testid="input-receiver-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="receiverPincode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{addressScope === "international" ? "Postal code *" : "Pincode *"}</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl" placeholder={addressScope === "international" ? "Postal / ZIP code" : "6-digit pincode"} data-testid="input-receiver-pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {destinationPoint.country && (
                    <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                      Country: <span className="font-medium text-zinc-900">{destinationPoint.country}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-zinc-400">
                    Map pin: {destinationPoint.lat.toFixed(5)}, {destinationPoint.lng.toFixed(5)} — drag the pin to refine.
                  </p>
                </div>
              )}
            </div>
          )}

          {bookStep === "details" && (
            <div className="space-y-5">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">When to pick up</h3>
                <div className="grid gap-3 grid-cols-2">
                  <FormField control={form.control} name="pickupDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" min={new Date().toISOString().split("T")[0]} className="rounded-xl" data-testid="input-pickup-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pickupTimeSlot" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slot *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || pickupSlots[0]?.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl" data-testid="select-pickup-time"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(pickupSlots.length ? pickupSlots : FALLBACK_PICKUP_SLOTS).map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {pickupSettings.cutoffNote ? (
                  <div className="rounded-xl border border-[#FF4907]/20 bg-[#FFF7F3] px-3.5 py-3 text-sm text-zinc-700 leading-relaxed">
                    {pickupSettings.cutoffNote}
                  </div>
                ) : null}
              </section>

              <section
                className="overflow-hidden rounded-2xl border border-[#FF4907]/25 bg-[#FFF7F3]"
                data-testid="section-sender-details"
              >
                <div className="flex items-center gap-2.5 border-b border-[#FF4907]/15 bg-[#FF4907]/10 px-3.5 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF4907] text-[11px] font-bold text-white">
                    P
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-900">Sender</h3>
                    <p className="text-[11px] text-zinc-500">Who is sending the parcel</p>
                  </div>
                </div>
                <div className="space-y-3 px-3.5 py-3.5">
                  {!isGuest && token && (
                    <AddressPicker token={token} addressType="sender" onSelect={(a) => applySavedAddress("sender", a)} />
                  )}
                  <button
                    type="button"
                    onClick={() => setBookStep("pickup")}
                    className="w-full rounded-xl border border-[#FF4907]/20 bg-white px-3 py-2.5 text-left transition-colors hover:border-[#FF4907]/40 hover:bg-[#FF4907]/5"
                    data-testid="button-edit-pickup-address"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#FF4907]/80">Pickup address</p>
                        <p className="mt-0.5 text-sm text-zinc-800 whitespace-pre-wrap break-words">
                          {[form.watch("senderAddress"), [form.watch("senderCity"), form.watch("senderState"), form.watch("senderPincode")].filter(Boolean).join(", ")].filter(Boolean).join("\n") || "No address set"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-[#FF4907]">Edit</span>
                    </div>
                  </button>
                  <div className="grid gap-3 grid-cols-2">
                    <FormField control={form.control} name="senderName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl bg-white" data-testid="input-sender-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="senderPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl bg-white" data-testid="input-sender-phone" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="senderEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} type="email" className="rounded-xl bg-white" data-testid="input-sender-email" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {!isGuest && token && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={saveSenderAddress} onCheckedChange={(v) => setSaveSenderAddress(!!v)} />
                      Save sender for next time
                    </label>
                  )}
                </div>
              </section>

              <section
                className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/40"
                data-testid="section-receiver-details"
              >
                <div className="flex items-center gap-2.5 border-b border-emerald-100 bg-emerald-50/80 px-3.5 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-[11px] font-bold text-white">
                    D
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-zinc-900">Receiver</h3>
                    <p className="text-[11px] text-zinc-500">Who will receive the parcel</p>
                  </div>
                </div>
                <div className="space-y-3 px-3.5 py-3.5">
                  {!isGuest && token && (
                    <AddressPicker token={token} addressType="receiver" onSelect={(a) => applySavedAddress("receiver", a)} />
                  )}
                  <button
                    type="button"
                    onClick={() => setBookStep("destination")}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
                    data-testid="button-edit-delivery-address"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/80">Delivery address</p>
                        <p className="mt-0.5 text-sm text-zinc-800 whitespace-pre-wrap break-words">
                          {[
                            form.watch("receiverAddress"),
                            [form.watch("receiverCity"), form.watch("receiverState"), form.watch("receiverPincode")].filter(Boolean).join(", "),
                            destinationPoint?.country,
                          ].filter(Boolean).join("\n") || "No address set"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-emerald-700">Edit</span>
                    </div>
                  </button>
                  <div className="grid gap-3 grid-cols-2">
                    <FormField control={form.control} name="receiverName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl bg-white" data-testid="input-receiver-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="receiverPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl bg-white" data-testid="input-receiver-phone" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {!isGuest && token && (
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={saveReceiverAddress} onCheckedChange={(v) => setSaveReceiverAddress(!!v)} />
                      Save receiver for next time
                    </label>
                  )}
                </div>
              </section>
            </div>
          )}

          {bookStep === "package" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Package & service</h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Weight, pieces, and contents are required before submitting.
                </p>
              </div>
              <div className="grid gap-3 grid-cols-2">
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="e.g. 2.5"
                        className="rounded-xl"
                        data-testid="input-weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="numberOfPieces" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pieces *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min="1"
                        placeholder="1"
                        className="rounded-xl"
                        data-testid="input-pieces"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="contentDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contents *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Documents, electronics…"
                      className="rounded-xl"
                      data-testid="input-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl" data-testid="select-service-type">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                    </FormControl>
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
                    <FormLabel>Courier (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl><SelectTrigger className="rounded-xl" data-testid="select-courier"><SelectValue placeholder="No preference" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No preference</SelectItem>
                        {partners.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} className="resize-none rounded-xl" rows={2} placeholder="Any special instructions" data-testid="input-notes" />
                  </FormControl>
                </FormItem>
              )} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => cameraRef.current?.click()} disabled={isMeasuring} data-testid="button-scan-package">
                  {isMeasuring ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                  Scan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => (isGuest ? toast({ title: "Photos", description: "Sign in to attach photos." }) : photoUploadRef.current?.click())}
                  disabled={isUploading || packagePhotos.length >= 3}
                  data-testid="button-upload-photo"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  Photo ({packagePhotos.length}/3)
                </Button>
              </div>
              {packagePhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {packagePhotos.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="h-14 w-14 rounded-lg border object-cover" />
                      <Button type="button" size="icon" variant="destructive" className="absolute -right-2 -top-2 h-5 w-5 rounded-full" onClick={() => removePhoto(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {bookStep === "review" && (() => {
            const v = form.getValues();
            const slotLabel =
              pickupSlotLabel(pickupSettings, v.pickupTimeSlot);
            const courierLabel =
              !v.courierPreference || v.courierPreference === "none"
                ? "No preference"
                : v.courierPreference;
            const pickupAddress = [
              v.senderAddress,
              [v.senderCity, v.senderState, v.senderPincode].filter(Boolean).join(", "),
            ]
              .filter(Boolean)
              .join("\n");
            const deliveryAddress = [
              v.receiverAddress,
              [v.receiverCity, v.receiverState, v.receiverPincode].filter(Boolean).join(", "),
              destinationPoint?.country,
            ]
              .filter(Boolean)
              .join("\n");

            const ReviewBlock = ({
              title,
              badge,
              badgeClass,
              onEdit,
              children,
              testId,
            }: {
              title: string;
              badge: string;
              badgeClass: string;
              onEdit: () => void;
              children: ReactNode;
              testId: string;
            }) => (
              <section
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                data-testid={testId}
              >
                <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3.5 py-2.5">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white",
                      badgeClass,
                    )}
                  >
                    {badge}
                  </span>
                  <h3 className="min-w-0 flex-1 text-sm font-semibold text-zinc-900">{title}</h3>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="shrink-0 text-xs font-semibold text-[#FF4907] hover:underline"
                    data-testid={`${testId}-edit`}
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-2 px-3.5 py-3 text-sm text-zinc-700">{children}</div>
              </section>
            );

            const Row = ({ label, value }: { label: string; value?: string | null }) =>
              value ? (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-zinc-800">{value}</p>
                </div>
              ) : null;

            return (
              <div className="space-y-3" data-testid="booking-review-summary">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Confirm your booking</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Review everything below. Edit any section if needed, then confirm to place the request.
                  </p>
                </div>

                <ReviewBlock
                  title="Pickup"
                  badge="P"
                  badgeClass="bg-[#FF4907]"
                  onEdit={() => editFromReview("pickup")}
                  testId="review-pickup"
                >
                  <Row label="Address" value={pickupAddress} />
                </ReviewBlock>

                <ReviewBlock
                  title="Delivery"
                  badge="D"
                  badgeClass="bg-emerald-600"
                  onEdit={() => editFromReview("destination")}
                  testId="review-delivery"
                >
                  <Row label="Address" value={deliveryAddress} />
                </ReviewBlock>

                <ReviewBlock
                  title="Contacts & schedule"
                  badge="C"
                  badgeClass="bg-zinc-700"
                  onEdit={() => editFromReview("details")}
                  testId="review-details"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Row
                      label="Sender"
                      value={[v.senderName, v.senderPhone, v.senderEmail].filter(Boolean).join("\n")}
                    />
                    <Row label="Receiver" value={[v.receiverName, v.receiverPhone].filter(Boolean).join("\n")} />
                  </div>
                  <Row label="Pickup schedule" value={[v.pickupDate, slotLabel].filter(Boolean).join(" · ")} />
                </ReviewBlock>

                <ReviewBlock
                  title="Package & service"
                  badge="Pk"
                  badgeClass="bg-sky-600"
                  onEdit={() => editFromReview("package")}
                  testId="review-package"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Row label="Weight" value={v.weight ? `${v.weight} kg` : null} />
                    <Row label="Pieces" value={v.numberOfPieces} />
                  </div>
                  <Row label="Contents" value={v.contentDescription} />
                  <Row
                    label="Service"
                    value={v.serviceType === "air" ? "Air (Express)" : "Surface (Standard)"}
                  />
                  <Row label="Courier" value={courierLabel} />
                  <Row label="Notes" value={v.notes} />
                  {packagePhotos.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                        Photos ({packagePhotos.length})
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {packagePhotos.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="h-12 w-12 rounded-lg border object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </ReviewBlock>

                <label
                  className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-3"
                  data-testid="review-acknowledge"
                >
                  <Checkbox
                    checked={detailsAcknowledged}
                    onCheckedChange={(v) => setDetailsAcknowledged(!!v)}
                    className="mt-0.5"
                    disabled={!confirmReady}
                  />
                  <span className="text-sm leading-snug text-zinc-700">
                    I have reviewed the pickup, delivery, contact, and package details above and they are correct.
                  </span>
                </label>
              </div>
            );
          })()}
        </BookShipmentWorkspace>
      </form>
    </Form>
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

function bookingToLoadItem(b: BookingRequestInfo): LoadItem {
  const status = b.tracking?.overallStatus ?? b.status;
  return {
    id: b.id,
    requestNumber: b.requestNumber,
    status,
    statusLabel: b.tracking?.overallStatusLabel ?? statusLabel(status),
    senderName: b.senderName,
    receiverName: b.receiverName,
    fromLabel: b.senderCity || b.pickupLocationName || "Pickup",
    toLabel: b.receiverCity || "Destination",
    createdAt: b.createdAt,
    progress: loadProgressFromStatus(status),
    phone: b.senderPhone,
  };
}

function MyBookingsTab({
  token,
  onBookShipment,
  focusId,
  onFocusConsumed,
  addLabel,
  emptyHint,
}: {
  token: string;
  onBookShipment: () => void;
  focusId?: string | null;
  onFocusConsumed?: () => void;
  addLabel?: string;
  emptyHint?: string;
}) {
  const [bookings, setBookings] = useState<BookingRequestInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<{
    request: BookingRequestInfo;
    shipment: ShipmentTrackingInfo | null;
    tracking: CustomerTrackingView;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/bookings", {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBookings(data);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    setIsLoading(true);
    loadBookings().finally(() => setIsLoading(false));
  }, [loadBookings]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadBookings();
    }, 30000);
    const onFocus = () => loadBookings();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadBookings]);

  const loadBookingDetail = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/customer/bookings/${id}`, {
        headers: { "x-customer-token": token },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const request = data.request as BookingRequestInfo;
      const shipment = data.shipment as ShipmentTrackingInfo | null;
      const tracking =
        data.tracking ??
        buildCustomerTracking(mapRequestForTracking(request), mapShipmentForTracking(shipment));
      return { request, shipment, tracking };
    },
    [token],
  );

  const viewDetail = useCallback(
    async (id: string) => {
      setSelectedBooking(id);
      setIsLoadingDetail(true);
      setBookingDetail(null);
      try {
        const detail = await loadBookingDetail(id);
        if (detail) setBookingDetail(detail);
      } catch {
        // ignore
      }
      setIsLoadingDetail(false);
    },
    [loadBookingDetail],
  );

  useEffect(() => {
    if (!focusId) return;
    void viewDetail(focusId).finally(() => onFocusConsumed?.());
  }, [focusId, viewDetail, onFocusConsumed]);

  useEffect(() => {
    if (!selectedBooking) return;
    const interval = window.setInterval(async () => {
      const detail = await loadBookingDetail(selectedBooking);
      if (detail) setBookingDetail(detail);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [selectedBooking, loadBookingDetail]);

  const loads = bookings.map(bookingToLoadItem);

  const detail: LoadDetail | null =
    bookingDetail && selectedBooking === bookingDetail.request.id
      ? {
          requestNumber: bookingDetail.request.requestNumber,
          statusLabel: bookingDetail.tracking.overallStatusLabel,
          senderName: bookingDetail.request.senderName,
          senderPhone: bookingDetail.request.senderPhone,
          receiverName: bookingDetail.request.receiverName,
          receiverCity: bookingDetail.request.receiverCity ?? undefined,
          pickupLocationName: bookingDetail.request.pickupLocationName ?? undefined,
          tracking: bookingDetail.tracking,
          bookingNumber: bookingDetail.shipment?.bookingNumber,
          awbNumber: bookingDetail.shipment?.awbNumber,
          mapLat: bookingDetail.request.pickupLat
            ? parseFloat(bookingDetail.request.pickupLat)
            : null,
          mapLng: bookingDetail.request.pickupLng
            ? parseFloat(bookingDetail.request.pickupLng)
            : null,
        }
      : null;

  return (
    <TrackingLoadsWorkspace
      loads={loads}
      isLoading={isLoading}
      selectedId={selectedBooking}
      onSelect={viewDetail}
      onAddLoad={onBookShipment}
      detail={detail}
      detailLoading={isLoadingDetail}
      addLabel={addLabel}
      emptyHint={emptyHint}
      onCloseDetail={() => {
        setSelectedBooking(null);
        setBookingDetail(null);
      }}
    />
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

function AccountTab({
  token,
  user,
  onUserUpdate,
  onLogout,
  showAddresses = true,
  showLogout = true,
}: {
  token: string;
  user: CustomerUserInfo;
  onUserUpdate: (user: CustomerUserInfo) => void;
  onLogout: () => void;
  showAddresses?: boolean;
  showLogout?: boolean;
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
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
          {showLogout ? (
          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" className="w-full" onClick={onLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
          ) : null}
        </CardContent>
      </Card>
      {showAddresses ? <SavedAddressesManager token={token} /> : null}
    </div>
  );
}

export default function CustomerPortalPage() {
  const params = useParams<{ slug?: string }>();
  const search = useSearch();
  const { toast } = useToast();
  const routeSlug = params.slug || "";
  const [slug, setSlug] = useState(routeSlug);
  const [office, setOffice] = useState<OfficeInfo | null>(null);
  const [partners, setPartners] = useState<PartnerInfo[]>([]);
  const [isLoadingOffice, setIsLoadingOffice] = useState(true);
  const [officeError, setOfficeError] = useState(false);
  const auth = useCustomerAuth(slug);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("book");
  const [goProfileView, setGoProfileView] = useState<GoProfileView>("menu");
  const [focusBookingId, setFocusBookingId] = useState<string | null>(null);
  const [pickupCustomerId, setPickupCustomerId] = useState<string | null>(null);
  const businessLanded = useRef(false);
  const goLanded = useRef(false);
  const isBusiness = Boolean(
    auth.isAuthenticated &&
      isBusinessAccount(auth.user) &&
      (explicitAccountKind(search) ?? explicitAccountKind(typeof window === "undefined" ? "" : window.location.search)) !== "individual",
  );
  const businessProfileQuery = useQuery({
    queryKey: ["/api/customer/business/profile"],
    queryFn: () => businessApi(auth.token!).profile(),
    enabled: Boolean(isBusiness && auth.token),
  });
  const needsBusinessOnboarding = Boolean(
    isBusiness &&
      businessProfileQuery.data &&
      !isBusinessProfileReady(businessProfileQuery.data as { companyName?: string; storeType?: string; pickupAddress?: string; pickupTimeSlot?: string }),
  );
  const [guestMode, setGuestMode] = useState(false);
  const [guestBookingsTick, setGuestBookingsTick] = useState(0);
  const [googleExchanging, setGoogleExchanging] = useState(() => {
    if (typeof window === "undefined") return false;
    const oauthParams = new URLSearchParams(window.location.search);
    return !!sessionStorage.getItem(CUSTOMER_GOOGLE_OAUTH_KEY) && (oauthParams.get("oauth") === "1" || oauthParams.has("code"));
  });
  const googleExchanged = useRef(false);

  const handlePortalLogin = useCallback((user: CustomerUserInfo, token: string) => {
    auth.login(user, token);
    setActiveTab("home");
  }, [auth.login]);

  useEffect(() => {
    if (!auth.isAuthenticated || auth.isLoading) return;
    const intended = explicitAccountKind(search) ?? explicitAccountKind(window.location.search);
    if (intended === "business" && !isBusinessAccount(auth.user)) {
      void auth.logout();
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.logout, auth.user, search]);

  useEffect(() => {
    if (!slug) return;
    if (wantsCustomerAuthScreen(search) || wantsCustomerAuthScreen(window.location.search)) {
      localStorage.removeItem(guestModeStorageKey(slug));
      setGuestMode(false);
      return;
    }
    setGuestMode(localStorage.getItem(guestModeStorageKey(slug)) === "1");
  }, [slug, search]);

  useEffect(() => {
    if (auth.isAuthenticated && slug) {
      localStorage.removeItem(guestModeStorageKey(slug));
      setGuestMode(false);
    }
  }, [auth.isAuthenticated, slug]);

  useEffect(() => {
    if (!slug || auth.isAuthenticated || googleExchanged.current) return;
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const windowParams = new URLSearchParams(window.location.search);
    const oauthError = params.get("error") || windowParams.get("error");
    if (oauthError) {
      sessionStorage.removeItem(CUSTOMER_GOOGLE_OAUTH_KEY);
      setGoogleExchanging(false);
      toast({
        title: "Google sign-in cancelled",
        description: params.get("error_description") || windowParams.get("error_description") || "Try again to continue with Google.",
        variant: "destructive",
      });
      clearCustomerOAuthParams();
      return;
    }

    const flag = sessionStorage.getItem(CUSTOMER_GOOGLE_OAUTH_KEY);
    const isOauthReturn =
      params.get("oauth") === "1" ||
      params.has("code") ||
      windowParams.get("oauth") === "1" ||
      windowParams.has("code");
    if (!flag || (flag !== slug && flag !== "1") || !isOauthReturn) {
      return;
    }

    let cancelled = false;
    setGoogleExchanging(true);

    const exchange = async (accessToken: string) => {
      if (cancelled || googleExchanged.current) return;
      googleExchanged.current = true;
      try {
        const res = await fetch(`/api/public/office/${slug}/customer/google`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(result.message || "Google sign-in failed");
        }
        sessionStorage.removeItem(CUSTOMER_GOOGLE_OAUTH_KEY);
        await supabase.auth.signOut();
        persistCustomerModule("business");
        handlePortalLogin(result.user, result.token);
        clearCustomerOAuthParams();
        toast({ title: "Welcome!", description: `Signed in as ${result.user.name}` });
      } catch (error: unknown) {
        googleExchanged.current = false;
        sessionStorage.removeItem(CUSTOMER_GOOGLE_OAUTH_KEY);
        toast({
          title: "Google sign-in failed",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
        clearCustomerOAuthParams();
      } finally {
        if (!cancelled) setGoogleExchanging(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) void exchange(data.session.access_token);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) void exchange(session.access_token);
    });
    const timeout = window.setTimeout(() => {
      if (cancelled || googleExchanged.current) return;
      sessionStorage.removeItem(CUSTOMER_GOOGLE_OAUTH_KEY);
      setGoogleExchanging(false);
      toast({
        title: "Google sign-in timed out",
        description: "Try Continue with Google again.",
        variant: "destructive",
      });
      clearCustomerOAuthParams();
    }, 15000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [slug, search, auth.isAuthenticated, handlePortalLogin, toast]);

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
    if (guestMode && !auth.isAuthenticated && (activeTab === "account" || activeTab === "home")) {
      setActiveTab("book");
    }
  }, [guestMode, auth.isAuthenticated, activeTab]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      businessLanded.current = false;
      goLanded.current = false;
      return;
    }
    if (isBusiness) {
      if (!businessLanded.current) {
        businessLanded.current = true;
        setActiveTab("home");
        return;
      }
      if (activeTab === "today" || activeTab === "book") setActiveTab("pickup");
      if (activeTab === "destinations") setActiveTab("customers");
      if (activeTab === "track") setActiveTab("bookings");
      return;
    }
    if (!goLanded.current) {
      goLanded.current = true;
      setActiveTab("home");
    }
  }, [auth.isAuthenticated, isBusiness, activeTab]);

  // Prevent document scroll while the portal shell is open (map/form scroll internally).
  useEffect(() => {
    const portalOpen = auth.isAuthenticated || guestMode;
    if (!portalOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [auth.isAuthenticated, guestMode]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingOffice(true);
    setOfficeError(false);

    const loadOffice = async () => {
      try {
        if (routeSlug) {
          const r = await fetchJsonWithRetry(`/api/public/office/${routeSlug}`);
          if (!r.ok) throw new Error();
          const data = await r.json();
          if (cancelled) return;
          setSlug(routeSlug);
          setOffice(data);
          return;
        }

        const defaultSlug = import.meta.env.VITE_DEFAULT_OFFICE_SLUG?.trim();
        if (defaultSlug) {
          const r = await fetchJsonWithRetry(`/api/public/office/${encodeURIComponent(defaultSlug)}`);
          if (r.ok) {
            const data = await r.json();
            if (cancelled) return;
            setSlug(defaultSlug);
            setOffice(data);
            return;
          }
        }

        const r = await fetchJsonWithRetry("/api/public/booking-office");
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

  if (isLoadingOffice || auth.isLoading || googleExchanging) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{googleExchanging ? "Signing in with Google..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (officeError || !office) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CustomerBookingHeader showBack />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center flex-1">
          <h1 className="text-2xl font-bold mb-4">Booking Unavailable</h1>
          <p className="text-muted-foreground mb-2">
            Parcel booking could not connect to the server. This is usually a database configuration issue on the live site.
          </p>
          <p className="text-sm text-muted-foreground">
            If you manage this site, set <code className="text-xs">DATABASE_POOL_URL</code> (Supabase pooler, port 6543, user{" "}
            <code className="text-xs">postgres.[project-ref]</code>) and <code className="text-xs">VITE_DEFAULT_OFFICE_SLUG=demo-office</code> in Vercel, then redeploy.
          </p>
        </div>
        <CustomerBookingFooter />
      </div>
    );
  }

  const portalOpen = auth.isAuthenticated || guestMode;

  return (
    <div className={portalOpen ? "h-dvh max-h-dvh overflow-hidden bg-[#F4F4F5]" : "min-h-screen bg-background flex flex-col"}>
      <PageSeo {...SEO_PAGES.book} />
      {!portalOpen ? (
        <AuthPage slug={slug} office={office} onLogin={handlePortalLogin} onContinueAsGuest={enterGuestMode} />
      ) : (
        <CustomerPortalShell
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setGoProfileView("menu");
            if (tab !== "bookings") setFocusBookingId(null);
          }}
          userName={auth.isAuthenticated ? auth.user?.name : "Guest"}
          userSubtitle={
            guestMode && !auth.isAuthenticated
              ? "Guest booking"
              : isBusiness
                ? XGOO_MODULES.pro.name
                : XGOO_MODULES.go.name
          }
          isGuest={guestMode && !auth.isAuthenticated}
          showHome={auth.isAuthenticated}
          showTrack
          showAccount={auth.isAuthenticated}
          isBusiness={isBusiness}
          officePhone={office.phone}
          onLogout={auth.logout}
          onSignIn={exitGuestMode}
          onHelp={
            auth.isAuthenticated
              ? () => {
                  setActiveTab("account");
                  setGoProfileView("help");
                }
              : undefined
          }
        >
          {isBusiness && auth.token && auth.user && businessProfileQuery.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF4907]" />
            </div>
          ) : isBusiness && auth.token && auth.user ? (
            <>
              {activeTab === "home" && (
                <div className="h-full overflow-y-auto">
                  {needsBusinessOnboarding ? (
                    <div className="px-4 py-4 md:px-6">
                      <BusinessOnboarding
                        token={auth.token}
                        slug={slug}
                        userName={auth.user.name}
                        userPhone={auth.user.phone}
                        onDone={() => {
                          void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/profile"] });
                          setActiveTab("customers");
                        }}
                      />
                    </div>
                  ) : (
                    <ProHome
                      token={auth.token}
                      userName={auth.user.name}
                      onPickup={() => setActiveTab("pickup")}
                      onCustomers={() => setActiveTab("customers")}
                      onShipments={() => setActiveTab("bookings")}
                      onSchedule={() => setActiveTab("schedule")}
                      onNotifications={() => {
                        setActiveTab("account");
                        setGoProfileView("notifications");
                      }}
                      onOpenBooking={(id) => {
                        setFocusBookingId(id);
                        setActiveTab("bookings");
                      }}
                    />
                  )}
                </div>
              )}
              {activeTab === "customers" && (
                <div className="h-full overflow-y-auto px-4 py-4 md:px-6">
                  {needsBusinessOnboarding ? (
                    <BusinessOnboarding
                      token={auth.token}
                      slug={slug}
                      userName={auth.user.name}
                      userPhone={auth.user.phone}
                      onDone={() => {
                        void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/profile"] });
                        setActiveTab("customers");
                      }}
                    />
                  ) : (
                    <DestinationsPanel
                      token={auth.token}
                      onOpenPickup={() => setActiveTab("pickup")}
                      onAddParcel={(customerId) => {
                        setPickupCustomerId(customerId);
                        setActiveTab("pickup");
                      }}
                    />
                  )}
                </div>
              )}
              {activeTab === "pickup" && (
                <div className="h-full overflow-y-auto px-4 py-4 md:px-6">
                  {needsBusinessOnboarding ? (
                    <BusinessOnboarding
                      token={auth.token}
                      slug={slug}
                      userName={auth.user.name}
                      userPhone={auth.user.phone}
                      onDone={() => {
                        void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/profile"] });
                        setActiveTab("pickup");
                      }}
                    />
                  ) : (
                    <TodayDispatch
                      token={auth.token}
                      onOpenCustomers={() => setActiveTab("customers")}
                      onOpenSchedule={() => setActiveTab("schedule")}
                      prefillCustomerId={pickupCustomerId}
                      onPrefillConsumed={() => setPickupCustomerId(null)}
                    />
                  )}
                </div>
              )}
              {activeTab === "schedule" && (
                <div className="h-full overflow-y-auto px-4 py-4 md:px-6">
                  {needsBusinessOnboarding ? (
                    <BusinessOnboarding
                      token={auth.token}
                      slug={slug}
                      userName={auth.user.name}
                      userPhone={auth.user.phone}
                      onDone={() => {
                        void queryClient.invalidateQueries({ queryKey: ["/api/customer/business/profile"] });
                        setActiveTab("schedule");
                      }}
                    />
                  ) : (
                    <SchedulePanel token={auth.token} slug={slug} userPhone={auth.user.phone} />
                  )}
                </div>
              )}
              {activeTab === "bookings" && (
                <div className="h-full min-h-0">
                  <MyBookingsTab
                    token={auth.token}
                    onBookShipment={() => setActiveTab("pickup")}
                    focusId={focusBookingId}
                    onFocusConsumed={() => setFocusBookingId(null)}
                    addLabel="Request pickup"
                    emptyHint="Request a pickup to see shipments here. Open any row to track it."
                  />
                </div>
              )}
              {activeTab === "account" && (
                <div className="h-full overflow-y-auto">
                  <GoProfile
                    token={auth.token}
                    userName={auth.user.name}
                    userPhone={auth.user.phone}
                    userEmail={auth.user.email}
                    module="pro"
                    view={goProfileView}
                    onViewChange={setGoProfileView}
                    onLogout={auth.logout}
                    onOpenSchedule={() => setActiveTab("schedule")}
                    onOpenDestinations={() => setActiveTab("customers")}
                    onOpenBooking={(id) => {
                      setFocusBookingId(id);
                      setActiveTab("bookings");
                    }}
                    personalPanel={
                      <AccountTab
                        token={auth.token}
                        user={auth.user}
                        showAddresses={false}
                        showLogout={false}
                        onUserUpdate={(u) => {
                          auth.setUser(u);
                          localStorage.setItem(`xgoo_customer_user_${slug}`, JSON.stringify(u));
                        }}
                        onLogout={auth.logout}
                      />
                    }
                  />
                </div>
              )}
            </>
          ) : (
            <>
          {activeTab === "home" && auth.isAuthenticated && auth.token && (
            <div className="h-full overflow-y-auto">
              <GoHome
                token={auth.token}
                slug={slug}
                userName={auth.user?.name}
                onBook={() => setActiveTab("book")}
                onShipments={() => setActiveTab("bookings")}
                onNotifications={() => {
                  setActiveTab("account");
                  setGoProfileView("notifications");
                }}
                onOpenBooking={(id) => {
                  setFocusBookingId(id);
                  setActiveTab("bookings");
                }}
              />
            </div>
          )}
          {activeTab === "book" && (
            <div className="h-full min-h-0">
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
            </div>
          )}
          {activeTab === "bookings" && (
            <div className="h-full min-h-0">
              {guestMode && !auth.isAuthenticated ? (
                <div className="h-full overflow-y-auto px-4 py-4 md:px-6">
                  <div className="mx-auto max-w-3xl">
                    <GuestBookingsTab slug={slug} refreshTick={guestBookingsTick} />
                  </div>
                </div>
              ) : (
                <MyBookingsTab
                  token={auth.token!}
                  onBookShipment={() => setActiveTab("book")}
                  focusId={focusBookingId}
                  onFocusConsumed={() => setFocusBookingId(null)}
                />
              )}
            </div>
          )}
          {activeTab === "track" && (
            <div className="h-full overflow-y-auto px-4 py-4 md:px-6">
              <div className="mx-auto max-w-3xl">
                <TrackTab slug={slug} />
              </div>
            </div>
          )}
          {activeTab === "account" && auth.isAuthenticated && auth.token && auth.user && (
            <div className="h-full overflow-y-auto">
              <GoProfile
                token={auth.token}
                userName={auth.user.name}
                userPhone={auth.user.phone}
                userEmail={auth.user.email}
                view={goProfileView}
                onViewChange={setGoProfileView}
                onLogout={auth.logout}
                onOpenBooking={(id) => {
                  setFocusBookingId(id);
                  setActiveTab("bookings");
                }}
                personalPanel={
                  <AccountTab
                    token={auth.token}
                    user={auth.user}
                    showAddresses={false}
                    showLogout={false}
                    onUserUpdate={(u) => {
                      auth.setUser(u);
                      localStorage.setItem(`xgoo_customer_user_${slug}`, JSON.stringify(u));
                    }}
                    onLogout={auth.logout}
                  />
                }
              />
            </div>
          )}
            </>
          )}
        </CustomerPortalShell>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Users,
  FileText,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Building2,
  CheckCircle,
  MapPin,
  Search,
  Navigation,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Bookings",
    description:
      "Create shipments in under 60 seconds with our POS-style interface designed for speed.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Track walk-in and business customers, manage credit limits, and view complete shipment history.",
  },
  {
    icon: FileText,
    title: "Instant Invoicing",
    description:
      "Generate professional PDF invoices automatically with GST calculations and multiple payment modes.",
  },
  {
    icon: Package,
    title: "Shipment Tracking",
    description:
      "Monitor shipments from booking to delivery with clear status updates and AWB management.",
  },
  {
    icon: Shield,
    title: "Multi-Partner Support",
    description:
      "Manage DTDC, FedEx, Blue Dart, and more with custom rate cards and AWB ranges.",
  },
  {
    icon: Clock,
    title: "Real-time Reports",
    description:
      "View daily bookings, revenue, pending payments, and export detailed reports to Excel.",
  },
];

const trustBadges = [
  "Free Forever Plan",
  "No Credit Card Required",
  "Mobile-First Design",
  "Made for India",
];

interface PublicOffice {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  publicSlug: string | null;
}

export default function LandingPage() {
  const finderRef = useRef<HTMLDivElement>(null);

  const scrollToFinder = () => {
    finderRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-semibold">XGoo</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Button variant="outline" onClick={scrollToFinder} data-testid="button-book-shipment-nav">
              Book a Shipment
            </Button>
            <Button asChild data-testid="button-get-started-nav">
              <a href="/api/login">
                Provider Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
            <div
              className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary/20 to-primary/5 opacity-30"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              Now serving 500+ courier offices across India
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your One-Stop
              <span className="block text-primary">Courier Platform</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you need to ship a parcel or run a courier business, XGoo connects customers
              with trusted courier offices across India.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              <Button size="lg" onClick={scrollToFinder} data-testid="button-book-shipment-hero">
                <Package className="mr-2 h-5 w-5" />
                Book a Shipment
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-register-business-hero">
                <a href="/api/login">
                  <Building2 className="mr-2 h-5 w-5" />
                  Register Your Business
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 pt-6 justify-center">
              {trustBadges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={finderRef} className="border-t bg-muted/30 py-16 sm:py-24" id="find-office">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">
              Find a Courier Office Near You
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover XGoo-registered courier offices in your area. Book shipments, track parcels, and manage everything online.
            </p>
          </div>
          <OfficeFinder />
        </div>
      </section>

      <section className="border-t py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">For Courier Businesses</Badge>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">
              Everything You Need to Run Your Office
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Indian courier offices. No complex setup, no steep learning curve.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background hover-elevate">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join hundreds of courier offices already using XGoo, or book your next shipment in minutes.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button size="lg" onClick={scrollToFinder} data-testid="button-book-shipment-cta">
              <Package className="mr-2 h-5 w-5" />
              Book a Shipment
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-get-started-cta">
              <a href="/api/login">
                Register Your Business
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src={xgooLogo} alt="XGoo" className="h-6 w-6 rounded" />
              <span className="font-semibold">XGoo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} XGoo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function OfficeFinder() {
  const [, navigate] = useLocation();
  const [offices, setOffices] = useState<PublicOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/offices")
      .then((res) => res.json())
      .then((data) => setOffices(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        "";
      if (city) {
        setUserCity(city);
        setSearchQuery(city);
      }
    } catch {
      setUserCity(null);
    } finally {
      setDetecting(false);
    }
  };

  const filteredOffices = offices.filter((office) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (office.name && office.name.toLowerCase().includes(q)) ||
      (office.city && office.city.toLowerCase().includes(q)) ||
      (office.state && office.state.toLowerCase().includes(q)) ||
      (office.pincode && office.pincode.includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, state, or pincode..."
            className="pl-10"
            data-testid="input-office-search"
          />
        </div>
        <Button
          variant="outline"
          onClick={detectLocation}
          disabled={detecting}
          data-testid="button-detect-location"
        >
          {detecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="mr-2 h-4 w-4" />
          )}
          {detecting ? "Detecting..." : "Near Me"}
        </Button>
      </div>

      {userCity && (
        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1" data-testid="text-detected-city">
          <MapPin className="h-3 w-3" />
          Showing offices near <span className="font-medium text-foreground">{userCity}</span>
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-40 mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOffices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No offices found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No courier offices match "${searchQuery}". Try a different city or pincode.`
                : "No courier offices are registered yet. Check back soon!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredOffices.map((office) => (
            <Card key={office.id} className="hover-elevate" data-testid={`card-office-${office.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold" data-testid={`text-office-name-${office.id}`}>{office.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>
                        {[office.city, office.state].filter(Boolean).join(", ")}
                        {office.pincode ? ` - ${office.pincode}` : ""}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    <Building2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                  {office.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {office.phone}
                    </span>
                  )}
                  {office.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {office.email}
                    </span>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/book/${office.publicSlug}`)}
                  data-testid={`button-book-office-${office.id}`}
                >
                  Book Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

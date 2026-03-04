import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveGlobe } from "@/components/InteractiveGlobe";
import {
  Package,
  Users,
  FileText,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle,
  MapPin,
  Search,
  Navigation,
  Phone,
  Mail,
  Loader2,
  Truck,
  Star,
  Award,
  Lightbulb,
  Globe2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

/* ─── data ─────────────────────────────────────────────── */

const presenceStats = [
  { value: "500", suffix: "+", label: "Courier Offices", sub: "Registered across India" },
  { value: "50K",  suffix: "+", label: "Monthly Shipments", sub: "Processed on platform" },
  { value: "30",   suffix: "+", label: "Partner Networks", sub: "DTDC, FedEx, BlueDart…" },
  { value: "415",  suffix: "+", label: "Daily Active Users", sub: "Counter staff & managers" },
  { value: "5",    suffix: "+", label: "Years Experience", sub: "Building courier tech" },
];

const features = [
  { icon: Zap,      title: "Lightning Fast Bookings",    description: "Create shipments in under 60 seconds with our POS-style interface designed for speed." },
  { icon: Users,    title: "Customer Management",        description: "Track walk-in and business customers, manage credit limits, and view complete history." },
  { icon: FileText, title: "Instant Invoicing",          description: "Generate professional PDF invoices with GST calculations and multiple payment modes." },
  { icon: Package,  title: "Shipment Tracking",          description: "Monitor shipments from booking to delivery with clear status updates and AWB management." },
  { icon: Shield,   title: "Multi-Partner Support",      description: "Manage DTDC, FedEx, Blue Dart, and more with custom rate cards and AWB ranges." },
  { icon: Clock,    title: "Real-time Reports",          description: "View daily bookings, revenue, pending payments, and export detailed Excel reports." },
];

const values = [
  { icon: Star,      title: "Quality",      description: "Excellence in every shipment — your parcels arrive safely and on time, every time." },
  { icon: CheckCircle, title: "Commitment",  description: "Our promise to customers drives everything from booking to final delivery." },
  { icon: Users,     title: "Teamwork",     description: "Courier offices and XGoo work hand-in-hand to build a seamless delivery ecosystem." },
  { icon: Lightbulb, title: "Innovation",   description: "Continuously evolving our platform to bring smarter tools to courier businesses." },
  { icon: Award,     title: "Leadership",   description: "Setting the standard for courier management software across India." },
  { icon: Globe2,    title: "Openness",     description: "Transparent pricing, open integrations, and clear communication at every step." },
];

const partners = ["DTDC", "FedEx", "Blue Dart", "Delhivery", "Ecom Express"];

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

/* ─── main component ────────────────────────────────────── */

export default function LandingPage() {
  const finderRef = useRef<HTMLDivElement>(null);
  const scrollToFinder = () => finderRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">XGoo</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#services" className="hover:text-gray-900 transition-colors">Services</a>
            <a href="#about"    className="hover:text-gray-900 transition-colors">About</a>
            <a href="#values"   className="hover:text-gray-900 transition-colors">Values</a>
            <button onClick={scrollToFinder} className="hover:text-gray-900 transition-colors">Find Office</button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToFinder}
              className="hidden sm:flex border-gray-200 text-gray-700 hover:border-[#FF4907] hover:text-[#FF4907]"
            >
              Book a Shipment
            </Button>
            <Button size="sm" asChild className="bg-[#FF4907] hover:bg-[#e03d00] text-white gap-1 border-0">
              <a href="/auth-page">
                Get Started <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-white">
        {/* very subtle dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.6,
          }}
        />
        {/* faint orange glow behind globe */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,73,7,0.06) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4907]/30 bg-[#FF4907]/5 px-4 py-1.5 text-sm text-[#9B320B] mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#FF4907]" />
                Trusted by 500+ courier offices across India
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-gray-900 leading-[1.12] tracking-tight">
                Taking India's courier{" "}
                <span style={{ color: "#FF4907" }}>further, faster,</span>
                {" "}and more securely
              </h1>
              <p className="mt-6 text-lg text-gray-500 max-w-lg leading-relaxed">
                XGoo is the all-in-one courier management platform — connecting
                offices, parcels, and customers across every pin-code in India.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={scrollToFinder}
                  className="gap-2 px-6 text-white border-0"
                  style={{ background: "#FF4907" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#e03d00")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#FF4907")}
                >
                  <Package className="h-5 w-5" />
                  Book a Shipment
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2 px-6 border-gray-200 text-gray-700 hover:border-gray-300"
                >
                  <a href="/auth-page">
                    <Truck className="h-5 w-5" />
                    Provider Login
                  </a>
                </Button>
              </div>

              <div className="flex flex-wrap gap-5 mt-8">
                {["Free Forever Plan", "No Credit Card", "Made for India"].map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-sm text-gray-400">
                    <CheckCircle className="h-4 w-4" style={{ color: "#FF4907" }} />
                    {b}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Globe — overflow-visible so sphere never clips */}
            <div className="flex justify-center items-center lg:justify-end">
              <div className="w-full max-w-[580px]">
                <InteractiveGlobe />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR PRESENCE ─────────────────────────────── */}
      <section className="bg-white border-b py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Our Presence Across India</h2>
            <p className="mt-2 text-gray-500">Meeting courier offices wherever they are</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-gray-100">
            {presenceStats.map((s) => (
              <div key={s.label} className="px-4 py-6 text-center first:pl-0 last:pr-0">
                <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-none">
                  {s.value}
                  <span className="text-[#FF4907]">{s.suffix}</span>
                </p>
                {/* orange underline accent */}
                <div className="mx-auto mt-2 mb-3 h-0.5 w-8 rounded-full" style={{ background: "#FF4907" }} />
                <p className="text-sm font-semibold text-gray-700">{s.label}</p>
                <p className="mt-0.5 text-xs text-gray-400 leading-snug">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS ─────────────────────────────────── */}
      <section className="bg-gray-50 py-10 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Supported courier networks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {partners.map((p) => (
              <span key={p} className="text-lg font-bold text-gray-300 hover:text-gray-600 transition-colors cursor-default tracking-tight">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICE OVERVIEW ─────────────────────────── */}
      <section id="services" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: "#FF4907" }}>
                Service Overview
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Seamless courier management for every need
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                XGoo delivers speed, reliability, and transparency — moving
                critical parcels, documents, and cargo with priority and care
                across India's top delivery networks.
              </p>
              <p className="mt-3 text-gray-500 leading-relaxed">
                With XGoo, you get a dedicated platform ensuring a smooth,
                reliable shipment journey from booking to delivery — all in one place.
              </p>
              <Button size="lg" onClick={scrollToFinder} className="mt-7 bg-gray-900 hover:bg-gray-800 text-white gap-2">
                Find an Office Near You <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>

            {/* visual grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl aspect-[4/5] flex flex-col items-center justify-center gap-3 p-6"
                style={{ background: "linear-gradient(135deg,#FF4907,#9B320B)" }}>
                <Truck className="h-12 w-12 text-white/80" />
                <span className="text-white font-semibold text-center text-sm">Express Delivery Network</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 p-4"
                  style={{ background: "linear-gradient(135deg,#391305,#1a0802)" }}>
                  <Package className="h-10 w-10 text-white/80" />
                  <span className="text-white font-semibold text-center text-xs">Secure Packaging</span>
                </div>
                <div className="rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 p-4"
                  style={{ background: "linear-gradient(135deg,#c0390a,#FF4907)" }}>
                  <TrendingUp className="h-10 w-10 text-white/80" />
                  <span className="text-white font-semibold text-center text-xs">Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT / STORY ────────────────────────────── */}
      <section id="about">
        <div className="grid lg:grid-cols-2 min-h-[460px]">
          {/* metrics side */}
          <div className="flex items-center p-10 lg:p-16" style={{ background: "linear-gradient(135deg,#FF4907 0%,#9B320B 60%,#391305 100%)" }}>
            <div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Cities",          value: "50+" },
                  { label: "Offices",         value: "500+" },
                  { label: "Daily Shipments", value: "5K+" },
                  { label: "Partners",        value: "10+" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl p-5 text-center border border-white/25 bg-white/10 backdrop-blur">
                    <p className="text-3xl font-extrabold text-white">{item.value}</p>
                    <p className="text-xs text-white/70 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* story text side */}
          <div className="flex items-center p-10 lg:p-16" style={{ background: "#1a0802" }}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: "#FF4907" }}>
                Our Story
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                The story of how our company was founded
              </h2>
              <p className="mt-5 text-white/50 leading-relaxed">
                XGoo was born from a simple observation: courier office owners were
                drowning in paperwork, manual AWB tracking, and disconnected
                systems. We set out to build the platform we wished existed —
                fast, simple, and purpose-built for India's courier industry.
              </p>
              <p className="mt-4 text-white/50 leading-relaxed">
                From a single office pilot to 500+ registered offices across India,
                our mission remains the same: give every courier business the tools
                to grow, scale, and serve customers better.
              </p>
              <Button asChild size="lg" className="mt-7 gap-2 text-white border-0" style={{ background: "#FF4907" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#e03d00")}
                onMouseLeave={e => (e.currentTarget.style.background = "#FF4907")}
              >
                <a href="/auth-page">Join Us <ArrowRight className="h-4 w-4" /></a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-widest">
              For Courier Businesses
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything You Need to Run Your Office</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Built specifically for Indian courier offices. No complex setup, no steep learning curve.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4" style={{ background: "rgba(255,73,7,0.08)" }}>
                    <f.icon className="h-5 w-5" style={{ color: "#FF4907" }} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────── */}
      <section id="values" className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 mb-14 items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: "#FF4907" }}>
                Our Values
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                The values that drive everything we do.
              </h2>
            </div>
            <p className="text-gray-500 leading-relaxed">
              At XGoo, our values shape every product decision, every customer
              interaction, and every line of code we write. Great logistics software
              starts with great principles.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4" style={{ background: "rgba(255,73,7,0.08)" }}>
                  <v.icon className="h-5 w-5" style={{ color: "#FF4907" }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFICE FINDER ────────────────────────────── */}
      <section ref={finderRef} className="py-20 sm:py-28 bg-white border-t" id="find-office">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: "#FF4907" }}>
              Book a Shipment
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Find a Courier Office Near You</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Discover XGoo-registered courier offices in your area. Book shipments, track parcels, and manage everything online.
            </p>
          </div>
          <OfficeFinder />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(135deg,#391305 0%,#1a0802 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle,#FF4907 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to grow your courier business?</h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Join hundreds of courier offices already using XGoo, or book your next shipment in minutes.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button size="lg" onClick={scrollToFinder} className="gap-2 px-8 text-white border-0" style={{ background: "#FF4907" }}>
              <Package className="h-5 w-5" />
              Book a Shipment
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white gap-2 px-8">
              <a href="/auth-page">
                Register Your Business <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="py-10 border-t" style={{ background: "#0d0401" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src={xgooLogo} alt="XGoo" className="h-7 w-7 rounded-lg" />
              <span className="font-bold text-white text-lg">XGoo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <button onClick={scrollToFinder} className="hover:text-white transition-colors">Book</button>
              <a href="/auth-page" className="hover:text-white transition-colors">Login</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
            </div>
            <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} XGoo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── OfficeFinder component ────────────────────────────── */

function OfficeFinder() {
  const [, navigate] = useLocation();
  const [offices, setOffices] = useState<PublicOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/offices")
      .then((r) => r.json())
      .then((d) => setOffices(d))
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
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
      if (city) { setUserCity(city); setSearchQuery(city); }
    } catch { setUserCity(null); } finally { setDetecting(false); }
  };

  const filtered = offices.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (o.name && o.name.toLowerCase().includes(q)) ||
      (o.city && o.city.toLowerCase().includes(q)) ||
      (o.state && o.state.toLowerCase().includes(q)) ||
      (o.pincode && o.pincode.includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city, state, or pincode..."
            className="pl-10 border-gray-200 focus-visible:ring-orange-500"
            data-testid="input-office-search"
          />
        </div>
        <Button
          variant="outline"
          onClick={detectLocation}
          disabled={detecting}
          data-testid="button-detect-location"
          className="gap-2"
        >
          {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {detecting ? "Detecting…" : "Near Me"}
        </Button>
      </div>

      {userCity && (
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-1" data-testid="text-detected-city">
          <MapPin className="h-3 w-3" />
          Showing offices near <span className="font-medium text-gray-900 ml-1">{userCity}</span>
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-gray-100">
              <CardContent className="p-5">
                <Skeleton className="h-5 w-40 mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-gray-100">
          <CardContent className="p-10 text-center">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-7 w-7" style={{ color: "#FF4907" }} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No offices found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? `No courier offices match "${searchQuery}". Try a different city or pincode.`
                : "No courier offices are registered yet. Check back soon!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((office) => (
            <Card key={office.id} className="border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" data-testid={`card-office-${office.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900" data-testid={`text-office-name-${office.id}`}>{office.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>
                        {[office.city, office.state].filter(Boolean).join(", ")}
                        {office.pincode ? ` - ${office.pincode}` : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1 whitespace-nowrap border"
                    style={{ background: "rgba(255,73,7,0.06)", color: "#9B320B", borderColor: "rgba(255,73,7,0.2)" }}>
                    <Building2 className="h-3 w-3" />Verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                  {office.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{office.phone}</span>}
                  {office.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{office.email}</span>}
                </div>
                <Button
                  className="w-full gap-2 text-white border-0"
                  style={{ background: "#FF4907" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#e03d00")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#FF4907")}
                  onClick={() => navigate(`/book/${office.publicSlug}`)}
                  data-testid={`button-book-office-${office.id}`}
                >
                  Book Now <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InteractiveGlobe } from "@/components/InteractiveGlobe";
import {
  Package,
  Shield,
  Clock,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Truck,
  MapPin,
  Search,
  ClipboardList,
  Star,
} from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

const bookingFeatures = [
  {
    icon: Package,
    title: "Book in Minutes",
    description: "Fill in pickup and delivery details online — no counter visit required.",
  },
  {
    icon: MapPin,
    title: "Doorstep Pickup",
    description: "Share your pickup location on the map and we'll collect from your doorstep.",
  },
  {
    icon: Search,
    title: "Live Tracking",
    description: "Track your parcel with your booking or AWB number anytime.",
  },
  {
    icon: ClipboardList,
    title: "Booking History",
    description: "Create an account to view past bookings and manage your profile.",
  },
  {
    icon: Shield,
    title: "Secure Handling",
    description: "Your parcels are handled with care across trusted courier networks.",
  },
  {
    icon: Clock,
    title: "Fast Processing",
    description: "Bookings are reviewed quickly and dispatched without delay.",
  },
];

const steps = [
  { step: "1", title: "Enter Details", description: "Add sender, receiver, and parcel information." },
  { step: "2", title: "Submit Request", description: "Confirm your booking — we'll schedule pickup." },
  { step: "3", title: "Track Delivery", description: "Follow your parcel until it reaches its destination." },
];

const partners = ["DTDC", "FedEx", "Blue Dart", "Delhivery", "Ecom Express"];

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">XGoo</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate("/book")}
              className="bg-[#FF4907] hover:bg-[#e03d00] text-white gap-1 border-0"
            >
              Book a Parcel <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" asChild className="hidden sm:flex border-gray-200">
              <a href="/auth-page">Staff Login</a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center bg-white">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.6,
          }}
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,73,7,0.06) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4907]/30 bg-[#FF4907]/5 px-4 py-1.5 text-sm text-[#9B320B] mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#FF4907]" />
                Courier booking made simple
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-gray-900 leading-[1.12] tracking-tight">
                Book your parcel{" "}
                <span style={{ color: "#FF4907" }}>online</span>
                {" "}in minutes
              </h1>
              <p className="mt-6 text-lg text-gray-500 max-w-lg leading-relaxed">
                XGoo lets you book courier pickups, track shipments, and manage
                deliveries — all from one place. Fast, reliable, and built for India.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/book")}
                  className="gap-2 px-6 text-white border-0"
                  style={{ background: "#FF4907" }}
                >
                  <Package className="h-5 w-5" />
                  Book a Parcel
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/book")}
                  className="gap-2 px-6 border-gray-200 text-gray-700"
                >
                  <Search className="h-5 w-5" />
                  Track Shipment
                </Button>
              </div>

              <div className="flex flex-wrap gap-5 mt-8">
                {["Doorstep Pickup", "Real-time Tracking", "Trusted Networks"].map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-sm text-gray-400">
                    <CheckCircle className="h-4 w-4" style={{ color: "#FF4907" }} />
                    {b}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center items-center lg:justify-end">
              <div className="w-full max-w-[580px]">
                <InteractiveGlobe />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gray-50 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: "#FF4907" }}>
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Three steps to ship your parcel</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ background: "#FF4907" }}
                >
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" onClick={() => navigate("/book")} className="gap-2 text-white border-0" style={{ background: "#FF4907" }}>
              Start Booking <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 border-b">
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

      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-widest">
              Why XGoo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything you need to send a parcel</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              A simple, reliable courier booking experience — from pickup to delivery.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookingFeatures.map((f) => (
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

      <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(135deg,#391305 0%,#1a0802 100%)" }}>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Star className="h-8 w-8 text-[#FF4907] mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to send your parcel?</h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Book online in minutes. Track your shipment every step of the way.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button size="lg" onClick={() => navigate("/book")} className="gap-2 px-8 text-white border-0" style={{ background: "#FF4907" }}>
              <Package className="h-5 w-5" />
              Book a Parcel
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white gap-2 px-8">
              <a href="/auth-page">
                <Truck className="h-4 w-4" />
                Staff Login
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-10 border-t" style={{ background: "#0d0401" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src={xgooLogo} alt="XGoo" className="h-7 w-7 rounded-lg" />
              <span className="font-bold text-white text-lg">XGoo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <button onClick={() => navigate("/book")} className="hover:text-white transition-colors">Book</button>
              <button onClick={() => navigate("/book")} className="hover:text-white transition-colors">Track</button>
              <a href="/auth-page" className="hover:text-white transition-colors">Staff Login</a>
            </div>
            <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} XGoo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicTrackingSearch } from "@/components/customer/PublicTrackingSearch";
import { InteractiveGlobe } from "@/components/InteractiveGlobe";
import { MarketingHeader, consumePendingSectionScroll } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ProductAttribution } from "@/components/marketing/ProductAttribution";
import { CourierPartnersMarquee } from "@/components/marketing/CourierPartnersMarquee";
import {
  Package,
  Shield,
  Clock,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  MapPin,
  Search,
  ClipboardList,
  Star,
} from "lucide-react";

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

export default function LandingPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const pending = consumePendingSectionScroll();
    const hashId = pending || window.location.hash.replace(/^#/, "");
    if (!hashId) return;
    requestAnimationFrame(() => {
      document.getElementById(hashId)?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <MarketingHeader />

      <section className="relative min-h-screen flex items-center bg-white overflow-x-hidden">
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.6,
          }}
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[min(600px,100vw)] h-[min(600px,100vw)] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,73,7,0.06) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-16 w-full min-w-0">
          <div className="grid lg:grid-cols-2 gap-8 items-center min-w-0">
            <div className="min-w-0 w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF4907]/30 bg-[#FF4907]/5 px-4 py-1.5 text-sm text-[#9B320B] mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#FF4907]" />
                Courier booking made simple
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-gray-900 leading-[1.12] tracking-tight break-words">
                Book your parcel{" "}
                <span style={{ color: "#FF4907" }}>online</span>
                {" "}in minutes
              </h1>
              <p className="mt-6 text-lg text-gray-500 max-w-lg leading-relaxed">
                XGoo lets you book courier pickups, track shipments, and manage
                deliveries — all from one place. Fast, reliable, and built for India.
              </p>
              <div className="mt-4">
                <ProductAttribution variant="badge" />
              </div>

              <div className="mt-8 space-y-5 w-full min-w-0 max-w-xl">
                <Button
                  size="lg"
                  onClick={() => navigate("/book")}
                  className="gap-2 px-4 sm:px-6 text-white border-0 w-full max-w-full h-12 sm:h-14 text-base font-semibold shadow-lg shadow-[#FF4907]/25 hover:shadow-xl hover:shadow-[#FF4907]/30"
                  style={{ background: "#FF4907" }}
                >
                  <Package className="h-5 w-5" />
                  Book a Parcel
                  <ArrowUpRight className="h-4 w-4" />
                </Button>

                <div className="pt-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Or track your shipment
                  </p>
                  <PublicTrackingSearch variant="hero" />
                </div>
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

            <div className="flex justify-center items-center lg:justify-end min-w-0 w-full overflow-hidden">
              <div className="w-full max-w-[580px] min-w-0">
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

      <CourierPartnersMarquee />

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
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

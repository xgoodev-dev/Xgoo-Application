import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PublicTrackingSearch } from "@/components/customer/PublicTrackingSearch";
import { MarketingHeader, consumePendingSectionScroll } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { CourierPartnersMarquee } from "@/components/marketing/CourierPartnersMarquee";
import { PageSeo } from "@/components/seo/PageSeo";
import { XGOO_CONTACT, XGOO_BRAND_FOUNDATION, XGOO_BRAND_VOICE } from "@/components/marketing/site-info";
import {
  SEO_PAGES,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Package,
  Shield,
  Clock,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  MapPin,
  Search,
  ClipboardList,
  Star,
  Truck,
  Headset,
  Zap,
  Plus,
} from "lucide-react";
import heroImage from "@/assets/landing/hero-xgoo-delivery.jpg";
import aboutImage from "@/assets/landing/purpose-deliveries.jpg";
import processImage from "@/assets/landing/process-delivery.jpg";
import faqImage from "@/assets/landing/faq-packing.jpg";
import ctaImage from "@/assets/landing/cta-shipping.jpg";

const ORANGE = "#FF4907";

/** Bundled via Vite imports so images always resolve (public /marketing was SPA-fallback HTML). */
const LANDING_IMAGES = {
  hero: heroImage,
  about: aboutImage,
  process: processImage,
  faq: faqImage,
  cta: ctaImage,
} as const;

const heroHighlights = [
  {
    title: XGOO_BRAND_FOUNDATION.principles[4].title,
    description: XGOO_BRAND_FOUNDATION.principles[4].summary,
    accent: false,
  },
  {
    title: XGOO_BRAND_FOUNDATION.principles[1].title,
    description: XGOO_BRAND_FOUNDATION.principles[1].summary,
    accent: true,
  },
  {
    title: XGOO_BRAND_FOUNDATION.principles[3].title,
    description: XGOO_BRAND_FOUNDATION.principles[3].summary,
    accent: false,
  },
];

const aboutPoints = [
  {
    title: XGOO_BRAND_FOUNDATION.purpose.label,
    detail: XGOO_BRAND_FOUNDATION.purpose.quote,
  },
  {
    title: XGOO_BRAND_FOUNDATION.mission.label,
    detail: XGOO_BRAND_FOUNDATION.mission.quote,
  },
  {
    title: XGOO_BRAND_FOUNDATION.vision.label,
    detail: XGOO_BRAND_FOUNDATION.vision.quote,
  },
];

const services = [
  {
    icon: Package,
    title: "Parcel booking",
    description:
      "Book shipments online in a few steps — technology that removes complexity from sending a parcel.",
  },
  {
    icon: MapPin,
    title: "Doorstep pickup",
    description:
      "Share your location and move goods forward with convenient pickup from your address.",
  },
  {
    icon: Search,
    title: "Live tracking",
    description:
      "Follow every movement with booking or AWB updates until delivery is complete.",
  },
  {
    icon: Headset,
    title: "Trusted support",
    description:
      "Exceptional experiences via WhatsApp and support when people and businesses need help.",
  },
];

const processSteps = [
  { step: "01", title: "Enter details", description: "Add sender, receiver, and parcel information." },
  { step: "02", title: "Confirm booking", description: "Submit your request and schedule pickup." },
  { step: "03", title: "We collect", description: "Our partner network picks up from your doorstep." },
  { step: "04", title: "Track & deliver", description: "Follow the journey until it reaches safely." },
];

const faqs = [
  {
    q: "How do I book a parcel on XGoo?",
    a: "Click Book a Parcel, enter pickup and delivery details, parcel size/weight, and submit. You’ll receive a booking reference to track progress.",
  },
  {
    q: "Which courier partners do you support?",
    a: "XGoo works with trusted networks including FedEx, Blue Dart, Delhivery, ST Courier, Franch Express, UPS, and Atlantic International Express.",
  },
  {
    q: "Can I track my shipment online?",
    a: "Yes. Use the tracking search on this page or after booking with your booking number or AWB to see the latest status.",
  },
  {
    q: "How do I contact support?",
    a: `Chat with us on WhatsApp at ${XGOO_CONTACT.whatsappDisplay}, call ${XGOO_CONTACT.phone}, email ${XGOO_CONTACT.email}, or use the Contact page. Support hours: ${XGOO_CONTACT.hours}.`,
  },
  {
    q: "What if my parcel is delayed or returned?",
    a: "Contact support with your booking or AWB number. Returns, reattempts, and claims follow our Return and Shipping policies and the assigned courier’s rules.",
  },
];

const testimonials = [
  {
    name: "Ananya R.",
    role: "Small business owner",
    quote:
      "Booking pickups used to take forever. With XGoo I schedule doorstep collection in minutes and track every order.",
  },
  {
    name: "Vikram S.",
    role: "Frequent shipper",
    quote:
      "Clear partner options and WhatsApp help made sending documents across cities stress-free.",
  },
  {
    name: "Meera K.",
    role: "Family customer",
    quote:
      "I booked a parcel for my parents online, got updates on time, and didn’t need to visit a counter.",
  },
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
    <div className="min-h-screen overflow-x-hidden bg-white text-zinc-900">
      <PageSeo
        {...SEO_PAGES.home}
        jsonLd={[
          buildOrganizationJsonLd(),
          buildWebSiteJsonLd(),
          buildLocalBusinessJsonLd(),
          buildFaqJsonLd(faqs),
          buildBreadcrumbJsonLd([{ name: "Home", path: "/" }]),
        ]}
      />
      <MarketingHeader />

      {/* Hero — full-bleed photo + brand headline */}
      <section className="relative isolate min-h-[100svh] pt-[7.5rem]">
        <div className="absolute inset-0 -z-10">
          <img
            src={LANDING_IMAGES.hero}
            alt="XGoo courier delivering a parcel — Send it. Delivered."
            className="h-full w-full object-cover object-[72%_center] sm:object-[65%_center]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        </div>

        <div className="mx-auto flex min-h-[calc(100svh-7.5rem)] max-w-7xl flex-col justify-end px-4 pb-36 pt-10 sm:px-6 sm:pb-40 lg:px-8 lg:pb-44">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              {XGOO_BRAND_FOUNDATION.coreIdea.title}
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {XGOO_BRAND_VOICE.heroHeadline}
              <span className="block" style={{ color: ORANGE }}>
                {XGOO_BRAND_VOICE.heroAccent}
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              {XGOO_BRAND_VOICE.heroSupport}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={() => navigate("/book")}
                className="h-12 gap-2 border-0 px-7 text-base font-semibold text-white hover:opacity-95"
                style={{ background: ORANGE }}
              >
                Book a Parcel
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
                className="h-12 border-white/40 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                Discover More
              </Button>
            </div>
          </div>
        </div>

        {/* Overlapping value strip */}
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3 sm:gap-4">
            {heroHighlights.map((item) => (
              <div
                key={item.title}
                className={`rounded-md px-5 py-5 shadow-xl sm:px-6 sm:py-6 ${
                  item.accent ? "text-white" : "border border-zinc-100 bg-white text-zinc-900"
                }`}
                style={item.accent ? { background: ORANGE } : undefined}
              >
                <h3 className="text-base font-bold sm:text-lg">{item.title}</h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    item.accent ? "text-white/90" : "text-zinc-500"
                  }`}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about-preview" className="bg-white pb-20 pt-28 sm:pb-28 sm:pt-36">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
              {XGOO_BRAND_FOUNDATION.purpose.label}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              {XGOO_BRAND_FOUNDATION.purpose.quote}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-500">
              {XGOO_BRAND_FOUNDATION.coreIdea.paragraphs[0]}{" "}
              {XGOO_BRAND_FOUNDATION.coreIdea.paragraphs[2]}
            </p>
            <ul className="mt-8 space-y-4">
              {aboutPoints.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: ORANGE }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">{point.title}</p>
                    <p className="text-sm text-zinc-500">{point.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              className="mt-8 gap-2 border-0 text-white"
              style={{ background: ORANGE }}
              onClick={() => navigate("/about")}
            >
              Learn more about us
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-md shadow-2xl">
              <img
                src={LANDING_IMAGES.about}
                alt="XGoo couriers delivering parcels — Send it. Delivered."
                className="aspect-[4/5] w-full object-cover object-center sm:aspect-[3/4]"
                loading="lazy"
              />
            </div>
            <div
              className="absolute -bottom-6 -left-4 rounded-md px-6 py-5 text-white shadow-xl sm:-left-6"
              style={{ background: ORANGE }}
            >
              <p className="text-4xl font-extrabold leading-none sm:text-5xl">7+</p>
              <p className="mt-2 text-sm font-medium text-white/90">Trusted courier networks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="features" className="border-y border-zinc-100 bg-zinc-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
              {XGOO_BRAND_FOUNDATION.mission.label}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Quality services that simplify movement
            </h2>
            <p className="mt-4 text-zinc-500">{XGOO_BRAND_FOUNDATION.mission.quote}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.title}
                className="group rounded-md border border-zinc-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-md text-white"
                  style={{ background: ORANGE }}
                >
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{service.description}</p>
                <button
                  type="button"
                  onClick={() => navigate("/book")}
                  className="mt-5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition group-hover:gap-2"
                  style={{ color: ORANGE }}
                >
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works / process feature */}
      <section id="how-it-works" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
                From booking to delivery in four clear steps
              </h2>
              <p className="mt-4 text-zinc-500">
                A straightforward flow designed for first-time shippers and frequent senders alike.
              </p>
              <div className="mt-8 space-y-5">
                {processSteps.map((step) => (
                  <div key={step.step} className="flex gap-4 border-l-2 border-zinc-100 pl-4">
                    <span className="text-sm font-extrabold" style={{ color: ORANGE }}>
                      {step.step}
                    </span>
                    <div>
                      <h3 className="font-bold text-zinc-900">{step.title}</h3>
                      <p className="text-sm text-zinc-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-md shadow-2xl">
              <img
                src={LANDING_IMAGES.process}
                alt="Packages prepared for courier delivery"
                className="aspect-[5/4] w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
                  Featured flow
                </p>
                <h3 className="mt-1 text-2xl font-bold text-white">Online parcel booking</h3>
                <Button
                  size="icon"
                  className="mt-4 h-11 w-11 rounded-md border-0 text-white"
                  style={{ background: ORANGE }}
                  onClick={() => navigate("/book")}
                  aria-label="Start booking"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CourierPartnersMarquee />

      {/* Tracking strip */}
      <section id="track" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
            Track shipment
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-zinc-900">Where is your parcel?</h2>
          <p className="mt-3 text-zinc-500">Enter your booking or AWB number to get the latest status.</p>
          <div className="mt-8 text-left">
            <PublicTrackingSearch variant="hero" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="overflow-hidden rounded-md shadow-xl">
            <img
              src={LANDING_IMAGES.faq}
              alt="XGoo team member packing a parcel — Send it. Delivered."
              className="aspect-[4/5] w-full object-cover object-center sm:aspect-[5/4] lg:aspect-[4/5]"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Answers to your courier questions
            </h2>
            <Accordion type="single" collapsible defaultValue="item-0" className="mt-8 space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.q}
                  value={`item-${index}`}
                  className="overflow-hidden rounded-md border-0 bg-white shadow-sm data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="px-5 py-4 text-left text-base font-semibold text-zinc-900 hover:no-underline data-[state=open]:bg-[#FF4907] data-[state=open]:text-white [&[data-state=open]>svg]:text-white">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="bg-white px-5 pb-4 pt-3 text-sm leading-relaxed text-zinc-500">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
              Testimonials
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Customer experiences that speak for us
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <figure
                key={item.name}
                className="rounded-md border border-zinc-100 bg-zinc-50 p-6 shadow-sm"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" style={{ color: ORANGE }} />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-zinc-600">“{item.quote}”</blockquote>
                <figcaption className="mt-5">
                  <p className="font-bold text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-400">{item.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose — compact benefit row */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Zap, title: "Fast booking", text: "Complete requests in minutes." },
            { icon: Shield, title: "Secure handling", text: "Careful partner networks." },
            { icon: Truck, title: "Wide coverage", text: "Domestic reach, trusted routes." },
            { icon: ClipboardList, title: "Clear records", text: "Booking history when you need it." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white"
                style={{ background: ORANGE }}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">{item.title}</p>
                <p className="text-sm text-zinc-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dark CTA */}
      <section className="relative overflow-hidden py-20 sm:py-24" style={{ background: "#141414" }}>
        <div className="absolute inset-0 opacity-30">
          <img
            src={LANDING_IMAGES.cta}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#141414]/80" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Clock className="mx-auto mb-4 h-8 w-8" style={{ color: ORANGE }} />
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to move forward?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60">
            {XGOO_BRAND_VOICE.beliefOneLiner} Book online, track every step, and experience movement
            without friction.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate("/book")}
              className="h-12 gap-2 border-0 px-8 text-white"
              style={{ background: ORANGE }}
            >
              <Package className="h-5 w-5" />
              Book a Parcel
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="h-12 border-white/25 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
            >
              Contact us
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  ClipboardList,
  Globe2,
  Home,
  MapPin,
  MessageCircle,
  Package,
  Ruler,
  Scale,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { DirectPickupDefaults } from "./DirectPickupForm";
import { PUBLIC_PAGE_SEO } from "@shared/seo-pages";
import heroDelivery from "@/assets/landing/hero-xgoo-delivery.jpg";
import processDelivery from "@/assets/landing/process-delivery.jpg";
import purposeDeliveries from "@/assets/landing/purpose-deliveries.jpg";
import ctaShipping from "@/assets/landing/cta-shipping.jpg";
import faqPacking from "@/assets/landing/faq-packing.jpg";

export type ServicePageKey =
  | "howItWorks"
  | "courierServicesHyderabad"
  | "internationalCourierHyderabad"
  | "courierPickupFromHome"
  | "internationalCourierCharges";

export type ServicePageCard = { icon: LucideIcon; title: string; text: string };

export type ServicePageContent = {
  key: ServicePageKey;
  /** Short name for breadcrumbs and footer links. */
  name: string;
  eyebrow: string;
  /** Hero heading, with `highlight` shown in brand orange. */
  heading: { before: string; highlight: string; after?: string };
  support: string;
  image: string;
  imageAlt: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  highlights: { icon: LucideIcon; label: string }[];
  pickupDefaults?: DirectPickupDefaults;
  serviceType: string;
  areaServed: string[];
  cardsHeading: string;
  cards: ServicePageCard[];
  steps?: { heading: string; items: { title: string; text: string }[] };
  faqs: { q: string; a: string }[];
  /** Show the Hyderabad → country route cards. */
  showRoutes?: boolean;
  related: { label: string; href: string }[];
};

const RELATED = {
  domestic: { label: "Domestic courier", href: "/domestic-courier" },
  international: { label: "International courier", href: "/international-courier" },
  howItWorks: { label: "How XGoo works", href: PUBLIC_PAGE_SEO.howItWorks.path },
  hyderabad: { label: "Courier services in Hyderabad", href: PUBLIC_PAGE_SEO.courierServicesHyderabad.path },
  intlHyderabad: {
    label: "International courier in Hyderabad",
    href: PUBLIC_PAGE_SEO.internationalCourierHyderabad.path,
  },
  pickup: { label: "Courier pickup from home", href: PUBLIC_PAGE_SEO.courierPickupFromHome.path },
  charges: { label: "International courier charges", href: PUBLIC_PAGE_SEO.internationalCourierCharges.path },
  track: { label: "Track a shipment", href: "/track" },
};

export const SERVICE_PAGES: Record<ServicePageKey, ServicePageContent> = {
  howItWorks: {
    key: "howItWorks",
    name: "How It Works",
    eyebrow: "Online courier booking",
    heading: { before: "How", highlight: "XGoo", after: "works" },
    support:
      "Book a courier in a few steps: tell us what you are sending and where, request a pickup from your address, and follow your parcel once it is dispatched — within India or abroad.",
    image: processDelivery,
    imageAlt: "XGoo courier collecting a parcel for delivery",
    primaryCta: { label: "Book a Pickup", href: "#book-pickup" },
    secondaryCta: { label: "Full booking", href: "/book" },
    highlights: [
      { icon: ClipboardList, label: "Book online" },
      { icon: Truck, label: "Doorstep pickup" },
      { icon: Search, label: "Track after dispatch" },
    ],
    serviceType: "Courier booking",
    areaServed: ["Hyderabad", "India"],
    cardsHeading: "What you can send with XGoo",
    cards: [
      {
        icon: Package,
        title: "Domestic shipments",
        text: "Documents and parcels to addresses across India, with pickup from your location.",
      },
      {
        icon: Globe2,
        title: "International shipments",
        text: "Personal parcels, documents and permitted business shipments to destinations abroad.",
      },
      {
        icon: ShieldCheck,
        title: "Permitted items only",
        text: "Restricted and prohibited items cannot be booked. We guide you on packing and paperwork.",
      },
    ],
    steps: {
      heading: "Four steps from booking to delivery",
      items: [
        {
          title: "Enter shipment details",
          text: "Share the pickup and delivery addresses, what you are sending, and an approximate weight.",
        },
        {
          title: "Request a pickup",
          text: "Choose doorstep pickup. Our team confirms the booking and the details before collection.",
        },
        {
          title: "Pack and hand over",
          text: "We help you check packing and documents, then collect the parcel and issue a booking reference.",
        },
        {
          title: "Follow your parcel",
          text: "Once dispatched, use your booking number or AWB on the tracking page to see updates.",
        },
      ],
    },
    faqs: [
      {
        q: "Do I need an account to book?",
        a: "You can start a booking online by entering your contact and shipment details. Our team confirms the booking with you before pickup.",
      },
      {
        q: "How will I know the price?",
        a: "Rates depend on the destination, weight, size and service. We share the price for your shipment before you confirm the booking.",
      },
      {
        q: "How do I track my parcel?",
        a: "After dispatch, enter your booking number or AWB on the XGoo tracking page, or open it in the XGoo Go app.",
      },
      {
        q: "Can XGoo ship internationally?",
        a: "Yes. XGoo coordinates international courier from Hyderabad to destinations including the USA, UK, Canada, Australia and the UAE.",
      },
    ],
    related: [RELATED.pickup, RELATED.domestic, RELATED.international, RELATED.track],
  },

  courierServicesHyderabad: {
    key: "courierServicesHyderabad",
    name: "Courier Services in Hyderabad",
    eyebrow: "Courier service in Hyderabad",
    heading: { before: "Courier services in", highlight: "Hyderabad" },
    support:
      "Send documents and parcels from Hyderabad within India or abroad. Book online, request a doorstep pickup from your address, and track your shipment after dispatch.",
    image: heroDelivery,
    imageAlt: "XGoo courier delivering a parcel in Hyderabad",
    primaryCta: { label: "Book a Pickup", href: "#book-pickup" },
    secondaryCta: { label: "Full booking", href: "/book" },
    highlights: [
      { icon: MapPin, label: "Based in Kondapur" },
      { icon: Truck, label: "Doorstep pickup" },
      { icon: Globe2, label: "Domestic and international" },
    ],
    serviceType: "Courier service",
    areaServed: ["Hyderabad", "India"],
    cardsHeading: "Courier options from Hyderabad",
    cards: [
      {
        icon: Package,
        title: "Domestic courier",
        text: "Send parcels and documents from Hyderabad to cities across India with pickup from your address.",
      },
      {
        icon: Globe2,
        title: "International courier",
        text: "Ship abroad from Hyderabad to the USA, UK, Canada, Australia, the UAE and other destinations.",
      },
      {
        icon: Home,
        title: "Pickup across the city",
        text: "Share your locality — Kondapur or elsewhere in Hyderabad — and we arrange collection.",
      },
    ],
    faqs: [
      {
        q: "Where is XGoo located in Hyderabad?",
        a: "XGoo started as Courier Point in Kondapur, Hyderabad, and arranges pickups from Kondapur and the wider city.",
      },
      {
        q: "Can I book a courier pickup from my home in Hyderabad?",
        a: "Yes. Enter your address and shipment details online and our team confirms the pickup with you.",
      },
      {
        q: "Do you send parcels outside India from Hyderabad?",
        a: "Yes. XGoo books international courier from Hyderabad to many countries. Rates vary by destination and weight.",
      },
      {
        q: "How do I get in touch?",
        a: "Call, email or WhatsApp the XGoo team during office hours, or use the contact page.",
      },
    ],
    showRoutes: true,
    related: [RELATED.domestic, RELATED.intlHyderabad, RELATED.pickup, RELATED.howItWorks],
  },

  internationalCourierHyderabad: {
    key: "internationalCourierHyderabad",
    name: "International Courier in Hyderabad",
    eyebrow: "International courier from Hyderabad",
    heading: { before: "International courier services in", highlight: "Hyderabad" },
    support:
      "Send international parcels from Hyderabad to destinations including the USA, UK, Canada, Australia and UAE. Request a courier pickup online and get a quote before you book.",
    image: ctaShipping,
    imageAlt: "International parcel packed for courier from Hyderabad",
    primaryCta: { label: "Book a Pickup", href: "#book-pickup" },
    secondaryCta: { label: "Full booking", href: "/book?scope=international" },
    highlights: [
      { icon: MapPin, label: "Pickup from Hyderabad" },
      { icon: Globe2, label: "USA, UK, Canada, Australia, UAE" },
      { icon: Calculator, label: "Quote before you book" },
    ],
    pickupDefaults: { shipmentType: "international" },
    serviceType: "International courier",
    areaServed: ["Hyderabad", "USA", "UK", "Canada", "Australia", "UAE"],
    cardsHeading: "Sending abroad from Hyderabad",
    cards: [
      {
        icon: Package,
        title: "Documents and parcels",
        text: "Personal belongings, gifts, documents and permitted business shipments that partner networks can carry.",
      },
      {
        icon: ShieldCheck,
        title: "Packing and paperwork",
        text: "We help you describe and pack the shipment so it is suitable for international courier handling.",
      },
      {
        icon: Search,
        title: "Tracking after dispatch",
        text: "Once your AWB is issued, follow status updates online until delivery is complete.",
      },
    ],
    faqs: [
      {
        q: "Which countries can I send to from Hyderabad?",
        a: "Popular routes include the USA, UK, Canada, Australia and the UAE. Contact us for other destinations.",
      },
      {
        q: "How much does international courier from Hyderabad cost?",
        a: "Charges depend on destination, actual and volumetric weight, and the type of shipment. We share a quote before you book.",
      },
      {
        q: "Can I send food or medicines abroad?",
        a: "Some items are restricted by destination country or courier partner. Tell us what you are sending and we confirm what can be booked.",
      },
      {
        q: "Will you pick up from my address?",
        a: "Yes. Share your Hyderabad address when booking and we arrange collection.",
      },
    ],
    showRoutes: true,
    related: [RELATED.charges, RELATED.international, RELATED.pickup, RELATED.track],
  },

  courierPickupFromHome: {
    key: "courierPickupFromHome",
    name: "Doorstep Courier Pickup",
    eyebrow: "Doorstep courier pickup",
    heading: { before: "Courier pickup from", highlight: "home" },
    support:
      "Skip the trip to a courier counter. Start an online parcel booking, enter your contact details, and we arrange a pickup from your door for domestic or international shipments.",
    image: purposeDeliveries,
    imageAlt: "Parcels collected from a customer's home by XGoo",
    primaryCta: { label: "Request a Pickup", href: "#book-pickup" },
    secondaryCta: { label: "Full booking", href: "/book" },
    highlights: [
      { icon: Home, label: "Pickup from your door" },
      { icon: Package, label: "Domestic and international" },
      { icon: MessageCircle, label: "Confirmed by our team" },
    ],
    serviceType: "Courier pickup",
    areaServed: ["Hyderabad"],
    cardsHeading: "How doorstep pickup works",
    cards: [
      {
        icon: ClipboardList,
        title: "Book online",
        text: "Enter the pickup address, destination and shipment details in a few minutes.",
      },
      {
        icon: MessageCircle,
        title: "We confirm",
        text: "Our team checks the details with you and confirms the pickup before collection.",
      },
      {
        icon: Truck,
        title: "We collect",
        text: "A pickup partner collects the parcel from your door and you receive a booking reference.",
      },
    ],
    faqs: [
      {
        q: "Which areas do you pick up from?",
        a: "XGoo arranges pickups from Kondapur and the wider Hyderabad area. Enter your address to check.",
      },
      {
        q: "Should I pack the parcel before pickup?",
        a: "Pack it if you can. We check the packing at pickup and help where it needs to be improved for courier handling.",
      },
      {
        q: "Can I book an international shipment for home pickup?",
        a: "Yes. Choose international when booking and we arrange pickup and share a quote before the shipment is confirmed.",
      },
      {
        q: "How do I track the parcel after pickup?",
        a: "Use your booking number or AWB on the XGoo tracking page once the shipment is dispatched.",
      },
    ],
    related: [RELATED.howItWorks, RELATED.hyderabad, RELATED.domestic, RELATED.international],
  },

  internationalCourierCharges: {
    key: "internationalCourierCharges",
    name: "International Courier Charges",
    eyebrow: "International courier charges",
    heading: { before: "International courier charges from", highlight: "India" },
    support:
      "See how international courier charges are worked out and which shipment details affect the price. Share your details and we come back with a quote for your parcel.",
    image: faqPacking,
    imageAlt: "Parcel being measured and packed for international courier",
    primaryCta: { label: "Request a Quote", href: "#book-pickup" },
    secondaryCta: { label: "Full booking", href: "/book?scope=international" },
    highlights: [
      { icon: Scale, label: "Weight-based pricing" },
      { icon: Globe2, label: "Varies by destination" },
      { icon: Calculator, label: "Quote before you book" },
    ],
    pickupDefaults: { shipmentType: "international" },
    serviceType: "International courier",
    areaServed: ["India"],
    cardsHeading: "What affects the price",
    cards: [
      {
        icon: Globe2,
        title: "Destination",
        text: "Each country and region has its own rates, so the same parcel costs different amounts to different places.",
      },
      {
        icon: Scale,
        title: "Actual weight",
        text: "The weight of the packed parcel on the scale, including the box and packing material.",
      },
      {
        icon: Ruler,
        title: "Volumetric weight",
        text: "Large, light boxes are charged on their size. The higher of actual and volumetric weight is used.",
      },
      {
        icon: Package,
        title: "Shipment type",
        text: "Documents, personal parcels and commercial shipments can be priced and processed differently.",
      },
      {
        icon: ShieldCheck,
        title: "Packing and paperwork",
        text: "Extra packing, or documents some shipments need, can change the final charge.",
      },
      {
        icon: Truck,
        title: "Courier partner and service",
        text: "Rates and transit times vary by the partner network and service chosen for the route.",
      },
    ],
    faqs: [
      {
        q: "Do you publish a fixed international rate card?",
        a: "No. Rates change with destination, weight, size and partner, so we share a quote for your specific shipment before you book.",
      },
      {
        q: "What is volumetric weight?",
        a: "A weight calculated from the box's length, width and height. If it is higher than the actual weight, the courier charges on it.",
      },
      {
        q: "Are customs duties included?",
        a: "Duties and taxes in the destination country are set by local customs and are usually separate from the courier charge. Ask us when you request a quote.",
      },
      {
        q: "How do I get a quote?",
        a: "Request a pickup or call, email or WhatsApp us with the destination, weight and box size. We reply with the charges.",
      },
    ],
    showRoutes: true,
    related: [RELATED.intlHyderabad, RELATED.international, RELATED.howItWorks, RELATED.pickup],
  },
};

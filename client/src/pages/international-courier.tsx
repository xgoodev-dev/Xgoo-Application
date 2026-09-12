import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageSeo } from "@/components/seo/PageSeo";
import { ServicesHero } from "@/components/marketing/ServicesHero";
import { RelatedRoutes } from "@/components/marketing/courier-routes/RelatedRoutes";
import {
  DOMESTIC_COURIER_PATH,
  INTERNATIONAL_COURIER_PATH,
  bookInternationalHref,
  listPublishedCourierRoutes,
} from "@/components/marketing/courier-routes";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import {
  SEO_PAGES,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildServiceJsonLd,
} from "@/lib/seo";
import { Globe2, MapPin, Package, Phone } from "lucide-react";
import heroImage from "@/assets/landing/hero-xgoo-delivery.jpg";

const ORANGE = "#FF4907";

export default function InternationalCourierPage() {
  const routes = listPublishedCourierRoutes();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "International Courier" },
  ];

  return (
    <MarketingLayout>
      <PageSeo
        {...SEO_PAGES.internationalCourier}
        jsonLd={[
          buildLocalBusinessJsonLd(),
          buildServiceJsonLd({
            name: "International courier from Hyderabad",
            description: SEO_PAGES.internationalCourier.description,
            path: INTERNATIONAL_COURIER_PATH,
            serviceType: "International courier",
            areaServed: ["Hyderabad", ...routes.map((route) => route.countryName)],
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "International Courier", path: INTERNATIONAL_COURIER_PATH },
          ]),
        ]}
      />
      <ServicesHero
        image={heroImage}
        imageAlt="XGoo courier moving an international parcel from Hyderabad"
        crumbs={crumbs}
        eyebrow="International courier service in Hyderabad"
        title={
          <>
            Send parcels and documents <span style={{ color: ORANGE }}>abroad</span> from Hyderabad
          </>
        }
        support="XGoo helps you book international courier from Hyderabad — documents, personal parcels, and permitted business shipments — with pickup from your address and tracking after confirmation."
        actions={
          <>
            <Button asChild size="lg" className="h-12 border-0 px-7 text-white" style={{ background: ORANGE }}>
              <a href="#book-pickup">Book a Pickup</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/40 bg-white/10 px-7 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href={bookInternationalHref()}>Full booking</Link>
            </Button>
          </>
        }
        highlights={[
          { icon: <MapPin className="h-4 w-4" style={{ color: ORANGE }} />, label: "Pickup from Hyderabad" },
          { icon: <Package className="h-4 w-4" style={{ color: ORANGE }} />, label: "Documents and parcels" },
          { icon: <Globe2 className="h-4 w-4" style={{ color: ORANGE }} />, label: "Worldwide destinations" },
        ]}
        pickupDefaults={{ shipmentType: "international" }}
        analyticsCategory="international-courier"
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Pickup from Hyderabad",
                text: "Share your locality, including Kondapur and the wider city, and we arrange collection.",
              },
              {
                icon: Package,
                title: "Documents and parcels",
                text: "Personal and business shipments that partner networks can carry. Restricted items cannot be booked.",
              },
              {
                icon: Globe2,
                title: "Country routes",
                text: "Start with a destination page for the country you are sending to, then book a pickup.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-md border border-zinc-100 bg-zinc-50 p-6">
                <item.icon className="h-5 w-5" style={{ color: ORANGE }} />
                <h2 className="mt-4 text-lg font-bold text-zinc-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm text-zinc-500">
            Transit times and rates vary by destination, weight, and partner. We do not publish a single
            international price. Need India-only shipping? See{" "}
            <Link href={DOMESTIC_COURIER_PATH} className="font-semibold hover:underline" style={{ color: ORANGE }}>
              domestic courier
            </Link>
            .
          </p>
          <a
            href={`tel:${XGOO_CONTACT.phone.replace(/\s/g, "")}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-[#FF4907]"
          >
            <Phone className="h-4 w-4" style={{ color: ORANGE }} />
            {XGOO_CONTACT.phone}
          </a>
        </div>
      </section>

      <RelatedRoutes routes={routes} heading="Courier from Hyderabad — popular countries" />
    </MarketingLayout>
  );
}

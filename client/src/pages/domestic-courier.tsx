import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageSeo } from "@/components/seo/PageSeo";
import { ServicesHero } from "@/components/marketing/ServicesHero";
import {
  DOMESTIC_COURIER_PATH,
  INTERNATIONAL_COURIER_PATH,
} from "@/components/marketing/courier-routes";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import {
  SEO_PAGES,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildServiceJsonLd,
} from "@/lib/seo";
import { MapPin, Package, Phone } from "lucide-react";
import heroImage from "@/assets/landing/purpose-deliveries.jpg";

const ORANGE = "#FF4907";

export default function DomesticCourierPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Domestic Courier" },
  ];

  return (
    <MarketingLayout>
      <PageSeo
        {...SEO_PAGES.domesticCourier}
        jsonLd={[
          buildLocalBusinessJsonLd(),
          buildServiceJsonLd({
            name: "Domestic courier in Hyderabad",
            description: SEO_PAGES.domesticCourier.description,
            path: DOMESTIC_COURIER_PATH,
            serviceType: "Domestic courier",
            areaServed: ["Hyderabad", "India"],
          }),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Domestic Courier", path: DOMESTIC_COURIER_PATH },
          ]),
        ]}
      />
      <ServicesHero
        image={heroImage}
        imageAlt="Packed parcels ready for domestic courier from Hyderabad"
        crumbs={crumbs}
        eyebrow="Courier service in Hyderabad"
        title={
          <>
            Domestic courier from <span style={{ color: ORANGE }}>Hyderabad</span>
          </>
        }
        support="Book doorstep pickup in Hyderabad and send documents or parcels across India. XGoo coordinates booking, pickup, and tracking through partner courier networks."
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
              <Link href="/book">Full booking</Link>
            </Button>
          </>
        }
        highlights={[
          { icon: <MapPin className="h-4 w-4" style={{ color: ORANGE }} />, label: "Pickup from Hyderabad" },
          { icon: <Package className="h-4 w-4" style={{ color: ORANGE }} />, label: "Documents and parcels" },
        ]}
        pickupDefaults={{ shipmentType: "domestic" }}
        analyticsCategory="domestic-courier"
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-md border border-zinc-100 bg-zinc-50 p-6">
              <MapPin className="h-5 w-5" style={{ color: ORANGE }} />
              <h2 className="mt-4 text-lg font-bold text-zinc-900">Pickup from Hyderabad</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Share your address in Kondapur or elsewhere in the city. We arrange collection and a booking
                reference you can track.
              </p>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 p-6">
              <Package className="h-5 w-5" style={{ color: ORANGE }} />
              <h2 className="mt-4 text-lg font-bold text-zinc-900">Documents and parcels</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Personal and business shipments within India. Restricted and prohibited items cannot be booked.
                Rates vary by destination and weight.
              </p>
            </div>
          </div>
          <p className="mt-8 max-w-3xl text-sm text-zinc-500">
            Sending abroad instead? See{" "}
            <Link href={INTERNATIONAL_COURIER_PATH} className="font-semibold hover:underline" style={{ color: ORANGE }}>
              international courier from Hyderabad
            </Link>
            , including routes to the USA, Australia, Canada, the UK, and the UAE.
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
    </MarketingLayout>
  );
}

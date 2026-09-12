import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageSeo } from "@/components/seo/PageSeo";
import { ServicesHero } from "@/components/marketing/ServicesHero";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import { CourierRouteFaqs } from "@/components/marketing/courier-routes/CourierRouteFaqs";
import { RelatedRoutes } from "@/components/marketing/courier-routes/RelatedRoutes";
import {
  INTERNATIONAL_COURIER_PATH,
  bookInternationalHref,
  courierRoutePath,
  getCourierRoute,
  parseCourierRouteSlug,
  relatedCourierRoutes,
  whatsappQuoteHref,
} from "@/components/marketing/courier-routes";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLocalBusinessJsonLd,
  buildServiceJsonLd,
} from "@/lib/seo";
import { trackMetaContact, trackMetaCustom } from "@/lib/meta-pixel";
import {
  CheckCircle2,
  FileText,
  MapPin,
  Package,
  Phone,
  Shield,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import heroImage from "@/assets/landing/hero-xgoo-delivery.jpg";
import processImage from "@/assets/landing/process-delivery.jpg";

const ORANGE = "#FF4907";

function trackRouteCta(action: string, analyticsRoute: string) {
  trackMetaCustom("RouteCTA", {
    content_name: action,
    content_category: analyticsRoute,
  });
}

function CourierRouteNotFound() {
  return (
    <MarketingLayout>
      <PageSeo
        title="Route not found | XGoo"
        description="This courier route page is not available."
        path="/"
        noIndex
      />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: ORANGE }}>
          Courier routes
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-zinc-900">This route is not published yet</h1>
        <p className="mt-4 text-zinc-500">
          We could not find that destination page. See international courier from Hyderabad, or talk to us
          about a booking.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="border-0 text-white" style={{ background: ORANGE }}>
            <Link href={INTERNATIONAL_COURIER_PATH}>International courier</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default function CourierRoutePage() {
  const [location] = useLocation();
  const slug = parseCourierRouteSlug(location);
  const route = getCourierRoute(slug);

  if (!route) {
    return <CourierRouteNotFound />;
  }

  const path = courierRoutePath(route.slug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "International Courier", path: INTERNATIONAL_COURIER_PATH },
    { name: `Hyderabad to ${route.countryName}` },
  ];
  const phoneHref = `tel:${XGOO_CONTACT.phone.replace(/\s/g, "")}`;
  const waHref = whatsappQuoteHref(XGOO_CONTACT.whatsapp, route);
  const bookHref = bookInternationalHref();

  return (
    <MarketingLayout>
      <PageSeo
        title={route.seoTitle}
        description={route.metaDescription}
        path={path}
        keywords={route.keywords}
        jsonLd={[
          buildLocalBusinessJsonLd(),
          buildServiceJsonLd({
            name: route.h1,
            description: route.metaDescription,
            path,
            serviceType: "International courier",
            areaServed: [route.originCity, route.countryName],
          }),
          buildFaqJsonLd(route.faqs),
          buildBreadcrumbJsonLd(crumbs.map((item) => ({ name: item.name, path: item.path || path }))),
        ]}
      />

      <ServicesHero
        image={heroImage}
        imageAlt={`Courier movement from ${route.originCity} to ${route.countryName}`}
        crumbs={crumbs}
        eyebrow={`International courier · ${route.originCity} to ${route.countryName}`}
        title={
          <>
            Courier Service from {route.originCity} to{" "}
            <span style={{ color: ORANGE }}>{route.countryName}</span>
          </>
        }
        support={route.heroSupport}
        actions={
          <>
            <Button
              asChild
              size="lg"
              className="h-12 border-0 px-7 text-white"
              style={{ background: ORANGE }}
              onClick={() => trackRouteCta("book", route.analyticsRoute)}
            >
              <a href="#book-pickup">Book a Pickup</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/40 bg-white/10 px-7 text-white hover:bg-white/20 hover:text-white"
              onClick={() => {
                trackMetaContact({ content_name: "WhatsApp", content_category: route.analyticsRoute });
                trackRouteCta("whatsapp", route.analyticsRoute);
              }}
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <SiWhatsapp className="mr-2 h-4 w-4" />
                WhatsApp Us
              </a>
            </Button>
          </>
        }
        highlights={[
          { icon: <MapPin className="h-4 w-4" style={{ color: ORANGE }} />, label: "Pickup from Hyderabad" },
          { icon: <Package className="h-4 w-4" style={{ color: ORANGE }} />, label: "Documents and parcels" },
          { icon: <Shield className="h-4 w-4" style={{ color: ORANGE }} />, label: "Tracking after confirmation" },
        ]}
        pickupDefaults={{
          destinationLocation: route.countryName,
          destinationCountry: route.countryName,
          shipmentType: "international",
        }}
        analyticsCategory={route.analyticsRoute}
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6 lg:px-8">
          {route.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="text-base leading-relaxed text-zinc-500">
              {paragraph}
            </p>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <a
              href={phoneHref}
              className="inline-flex items-center gap-2 font-medium text-zinc-900 hover:text-[#FF4907]"
              onClick={() => {
                trackMetaContact({ content_name: "Phone", content_category: route.analyticsRoute });
                trackRouteCta("phone", route.analyticsRoute);
              }}
            >
              <Phone className="h-4 w-4" style={{ color: ORANGE }} />
              {XGOO_CONTACT.phone}
            </a>
            <Link href="/contact" className="text-sm font-semibold hover:underline" style={{ color: ORANGE }}>
              Talk to XGoo on the contact page
            </Link>
            <Link
              href={INTERNATIONAL_COURIER_PATH}
              className="text-sm font-semibold hover:underline"
              style={{ color: ORANGE }}
            >
              International courier from Hyderabad
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-100 bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
            Why XGoo
          </p>
          <h2 className="mt-3 max-w-3xl text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            International courier from Hyderabad, kept simple
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {route.benefits.map((benefit) => (
              <div key={benefit.title} className="rounded-md border border-zinc-100 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-zinc-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
            What you can send
          </p>
          <h2 className="mt-3 text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Documents and permitted parcels to {route.destinationPhrase}
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {route.shipmentTypes.map((type) => (
              <div
                key={type}
                className="flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                <FileText className="h-4 w-4 shrink-0" style={{ color: ORANGE }} />
                <span className="text-sm font-medium text-zinc-800">{type}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-zinc-500">
            Restricted and prohibited items — including hazardous materials, currency, illegal goods, and other
            courier-banned categories — cannot be shipped. Destination-country regulations and partner rules
            apply. See our{" "}
            <Link href="/shipping-policy" className="font-semibold hover:underline" style={{ color: ORANGE }}>
              shipping policy
            </Link>{" "}
            if you are unsure.
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-100 bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
              Hyderabad to {route.countryName}
            </p>
            <h2 className="mt-3 text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              {route.reasonsHeading}
            </h2>
            <ul className="mt-8 space-y-4">
              {route.reasons.map((reason) => (
                <li key={reason} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: ORANGE }} />
                  <span className="text-sm leading-relaxed text-zinc-600">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-md shadow-xl">
            <img
              src={processImage}
              alt={`Packages prepared for international courier from Hyderabad to ${route.countryName}`}
              className="aspect-[5/4] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          {route.destinationSections.map((section) => (
            <div key={section.heading} className="max-w-3xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 text-base leading-relaxed text-zinc-500">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
            Cities
          </p>
          <h2 className="mt-3 text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            {route.citiesHeading}
          </h2>
          <p className="mt-3 max-w-2xl text-zinc-500">
            These are the {route.countryName} cities we are asked about most often from Hyderabad. City-specific
            pages will follow; for now, name the city when you book a pickup.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {route.cities.map((city) => (
              <li
                key={city.name}
                className="rounded-md border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800"
              >
                {city.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CourierRouteFaqs
        faqs={route.faqs}
        heading={`Courier from Hyderabad to ${route.countryName} — questions we hear often`}
        imageAlt={`XGoo packing guidance for a parcel from Hyderabad to ${route.countryName}`}
      />

      <RelatedRoutes
        routes={relatedCourierRoutes(route)}
        heading={`Other international routes from ${route.originCity}`}
      />

      <section className="relative overflow-hidden py-20 sm:py-24" style={{ background: "#141414" }}>
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-[1.7rem] font-extrabold text-white sm:text-4xl">
            Ready to send a parcel to {route.destinationPhrase}?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60">
            Book a pickup from Hyderabad, or talk to XGoo on WhatsApp.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 border-0 px-8 text-white"
              style={{ background: ORANGE }}
              onClick={() => trackRouteCta("book_pickup_footer", route.analyticsRoute)}
            >
              <a href="#book-pickup">Book a Pickup</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
              onClick={() => trackRouteCta("book_footer", route.analyticsRoute)}
            >
              <Link href={bookHref}>Book a Courier</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
              onClick={() => trackMetaContact({ content_name: "WhatsApp", content_category: route.analyticsRoute })}
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

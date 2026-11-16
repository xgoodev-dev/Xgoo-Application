import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ServicesHero } from "@/components/marketing/ServicesHero";
import { CourierRouteFaqs } from "@/components/marketing/courier-routes/CourierRouteFaqs";
import { RelatedRoutes } from "@/components/marketing/courier-routes/RelatedRoutes";
import { listPublishedCourierRoutes } from "@/components/marketing/courier-routes";
import { SERVICE_PAGES, type ServicePageKey } from "@/components/marketing/service-pages";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import { PageSeo } from "@/components/seo/PageSeo";
import {
  SEO_PAGES,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLocalBusinessJsonLd,
  buildServiceJsonLd,
} from "@/lib/seo";

const ORANGE = "#FF4907";

/** Anchor for in-page jumps, router Link otherwise. Forwards Button's asChild props. */
const CtaLink = forwardRef<HTMLAnchorElement, { href: string } & ComponentPropsWithoutRef<"a">>(
  function CtaLink({ href, ...props }, ref) {
    return href.startsWith("#") ? (
      <a ref={ref} href={href} {...props} />
    ) : (
      <Link ref={ref} href={href} {...props} />
    );
  },
);

/** Shared layout for the SEO service pages (How It Works, Hyderabad, pickup, charges…). */
function ServiceLandingPage({ pageKey }: { pageKey: ServicePageKey }) {
  const page = SERVICE_PAGES[pageKey];
  const seo = SEO_PAGES[pageKey];
  const crumbs = [{ name: "Home", path: "/" }, { name: page.name }];

  return (
    <MarketingLayout>
      <PageSeo
        {...seo}
        jsonLd={[
          buildLocalBusinessJsonLd(),
          buildServiceJsonLd({
            name: page.name,
            description: seo.description,
            path: seo.path,
            serviceType: page.serviceType,
            areaServed: page.areaServed,
          }),
          buildFaqJsonLd(page.faqs),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: page.name, path: seo.path },
          ]),
        ]}
      />
      <ServicesHero
        image={page.image}
        imageAlt={page.imageAlt}
        crumbs={crumbs}
        eyebrow={page.eyebrow}
        title={
          <>
            {page.heading.before} <span style={{ color: ORANGE }}>{page.heading.highlight}</span>
            {page.heading.after ? ` ${page.heading.after}` : null}
          </>
        }
        support={page.support}
        actions={
          <>
            <Button asChild size="lg" className="h-12 border-0 px-7 text-white" style={{ background: ORANGE }}>
              <CtaLink href={page.primaryCta.href}>{page.primaryCta.label}</CtaLink>
            </Button>
            {page.secondaryCta ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/40 bg-white/10 px-7 text-white hover:bg-white/20 hover:text-white"
              >
                <CtaLink href={page.secondaryCta.href}>{page.secondaryCta.label}</CtaLink>
              </Button>
            ) : null}
          </>
        }
        highlights={page.highlights.map((item) => ({
          icon: <item.icon className="h-4 w-4" style={{ color: ORANGE }} />,
          label: item.label,
        }))}
        pickupDefaults={page.pickupDefaults}
        analyticsCategory={seo.path.slice(1)}
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
            {page.cardsHeading}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.cards.map((card) => (
              <div key={card.title} className="rounded-md border border-zinc-100 bg-zinc-50 p-6">
                <card.icon className="h-5 w-5" style={{ color: ORANGE }} />
                <h3 className="mt-4 text-lg font-bold text-zinc-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {page.steps ? (
        <section className="border-t border-zinc-100 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              {page.steps.heading}
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {page.steps.items.map((step, index) => (
                <li key={step.title} className="rounded-md border border-zinc-100 p-6">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: ORANGE }}
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-zinc-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <CourierRouteFaqs faqs={page.faqs} heading={`${page.name}: common questions`} imageAlt={page.imageAlt} />

      {page.showRoutes ? (
        <RelatedRoutes routes={listPublishedCourierRoutes()} heading="Courier from Hyderabad — popular countries" />
      ) : null}

      <section className="border-t border-zinc-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
            Related services
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {page.related.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:text-[#FF4907]"
                >
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={`tel:${XGOO_CONTACT.phone.replace(/\s/g, "")}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-[#FF4907]"
          >
            <Phone className="h-4 w-4" style={{ color: ORANGE }} />
            {XGOO_CONTACT.phone}
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}

export function HowItWorksPage() {
  return <ServiceLandingPage pageKey="howItWorks" />;
}

export function CourierServicesHyderabadPage() {
  return <ServiceLandingPage pageKey="courierServicesHyderabad" />;
}

export function InternationalCourierHyderabadPage() {
  return <ServiceLandingPage pageKey="internationalCourierHyderabad" />;
}

export function CourierPickupFromHomePage() {
  return <ServiceLandingPage pageKey="courierPickupFromHome" />;
}

export function InternationalCourierChargesPage() {
  return <ServiceLandingPage pageKey="internationalCourierCharges" />;
}

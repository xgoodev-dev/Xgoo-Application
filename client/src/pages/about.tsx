import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageSeo } from "@/components/seo/PageSeo";
import {
  XGOO_BRAND_FOUNDATION,
  XGOO_BRAND_VOICE,
} from "@/components/marketing/brand-foundation";
import { SEO_PAGES, buildBreadcrumbJsonLd, buildOrganizationJsonLd } from "@/lib/seo";
import {
  ArrowRight,
  Compass,
  Eye,
  Heart,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

const philosophyItems = [
  {
    id: "core-idea",
    icon: Zap,
    label: XGOO_BRAND_FOUNDATION.coreIdea.label,
    title: XGOO_BRAND_FOUNDATION.coreIdea.title,
    tagline: XGOO_BRAND_FOUNDATION.coreIdea.summary,
    paragraphs: [...XGOO_BRAND_FOUNDATION.coreIdea.paragraphs],
  },
  {
    id: "brand-belief",
    icon: Sparkles,
    label: XGOO_BRAND_FOUNDATION.brandBelief.label,
    title: XGOO_BRAND_FOUNDATION.brandBelief.quote,
    paragraphs: [...XGOO_BRAND_FOUNDATION.brandBelief.paragraphs],
  },
  {
    id: "purpose",
    icon: Heart,
    label: XGOO_BRAND_FOUNDATION.purpose.label,
    title: XGOO_BRAND_FOUNDATION.purpose.quote,
    paragraphs: [...XGOO_BRAND_FOUNDATION.purpose.paragraphs],
  },
  {
    id: "vision",
    icon: Eye,
    label: XGOO_BRAND_FOUNDATION.vision.label,
    title: XGOO_BRAND_FOUNDATION.vision.quote,
    paragraphs: [...XGOO_BRAND_FOUNDATION.vision.paragraphs],
  },
  {
    id: "mission",
    icon: Target,
    label: XGOO_BRAND_FOUNDATION.mission.label,
    title: XGOO_BRAND_FOUNDATION.mission.quote,
    paragraphs: [...XGOO_BRAND_FOUNDATION.mission.paragraphs],
  },
];

const principles = XGOO_BRAND_FOUNDATION.principles.map((principle) => ({
  number: principle.number,
  title: principle.title,
  description: principle.summary,
}));

const philosophySummary = [
  XGOO_BRAND_FOUNDATION.coreIdea.summary,
  XGOO_BRAND_FOUNDATION.brandBelief.quote,
  XGOO_BRAND_FOUNDATION.purpose.quote,
  XGOO_BRAND_FOUNDATION.vision.quote,
  XGOO_BRAND_FOUNDATION.mission.quote,
];

const promiseItems = [
  XGOO_BRAND_FOUNDATION.purpose.quote,
  XGOO_BRAND_FOUNDATION.mission.quote,
  XGOO_BRAND_FOUNDATION.brandBelief.quote,
  XGOO_BRAND_FOUNDATION.principles[9].summary,
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mb-3 block text-xs font-semibold uppercase tracking-widest"
      style={{ color: "#FF4907" }}
    >
      {children}
    </span>
  );
}

export default function AboutPage() {
  const [, navigate] = useLocation();

  return (
    <MarketingLayout>
      <PageSeo
        {...SEO_PAGES.about}
        jsonLd={[
          buildOrganizationJsonLd(),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <section className="relative overflow-hidden border-b bg-zinc-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-widest">
            {XGOO_BRAND_FOUNDATION.documentTitle}
          </Badge>
          <h1 className="max-w-4xl text-3xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            {XGOO_BRAND_FOUNDATION.coreIdea.title} is the foundation of{" "}
            <span style={{ color: "#FF4907" }}>XGoo</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-500 sm:text-xl">
            {XGOO_BRAND_VOICE.beliefOneLiner}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-500">
            {XGOO_BRAND_FOUNDATION.coreIdea.paragraphs[1]}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionLabel>{XGOO_BRAND_FOUNDATION.coreIdea.label}</SectionLabel>
            <h2 className="mb-6 text-3xl font-bold text-zinc-900 sm:text-4xl">
              {XGOO_BRAND_FOUNDATION.coreIdea.summary}
            </h2>
            <div className="space-y-4 leading-relaxed text-zinc-500">
              {XGOO_BRAND_FOUNDATION.coreIdea.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="philosophy" className="border-y bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <SectionLabel>Brand Foundation</SectionLabel>
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              {XGOO_BRAND_FOUNDATION.brandBelief.quote}
            </h2>
          </div>
          <div className="space-y-6">
            {philosophyItems.map((item) => (
              <Card key={item.id} id={item.id} className="scroll-mt-32 border border-zinc-100 bg-white">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(255,73,7,0.08)" }}
                    >
                      <item.icon className="h-6 w-6" style={{ color: "#FF4907" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        {item.label}
                      </p>
                      <h3 className="mb-4 text-xl font-bold text-zinc-900 sm:text-2xl">{item.title}</h3>
                      {"tagline" in item && item.tagline ? (
                        <p className="mb-3 font-medium text-zinc-700">{item.tagline}</p>
                      ) : null}
                      <div className="space-y-3">
                        {item.paragraphs.map((paragraph, index) => (
                          <p key={index} className="leading-relaxed text-zinc-500">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <SectionLabel>Principles</SectionLabel>
            <h2 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
              What guides every decision we make
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {principles.map((principle) => (
              <Card key={principle.number} className="border border-zinc-100 transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: "#FF4907" }}
                    >
                      {principle.number}
                    </div>
                    <div>
                      <h3 className="mb-2 text-base font-semibold text-zinc-900">{principle.title}</h3>
                      <p className="text-sm leading-relaxed text-zinc-500">{principle.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionLabel>{XGOO_BRAND_FOUNDATION.purpose.label}</SectionLabel>
              <h2 className="mb-6 text-3xl font-bold text-zinc-900 sm:text-4xl">Our Promise</h2>
              <ul className="space-y-4">
                {promiseItems.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-zinc-600">
                    <Compass className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "#FF4907" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 font-medium leading-relaxed text-zinc-500">
                Because when movement becomes better, progress becomes possible.
              </p>
            </div>
            <Card className="border border-zinc-100 shadow-sm">
              <CardContent className="p-8">
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "rgba(255,73,7,0.08)" }}
                >
                  <Lightbulb className="h-6 w-6" style={{ color: "#FF4907" }} />
                </div>
                <h3 className="mb-4 text-xl font-bold text-zinc-900">Brand Foundation at a glance</h3>
                <div className="space-y-3">
                  {philosophySummary.map((line) => (
                    <p key={line} className="leading-relaxed text-zinc-600">
                      {line}
                    </p>
                  ))}
                </div>
                <p className="mt-6 border-t pt-6 leading-relaxed text-zinc-500">
                  {XGOO_BRAND_FOUNDATION.vision.quote}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>{XGOO_BRAND_FOUNDATION.vision.label}</SectionLabel>
            <div className="mb-6 flex justify-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,73,7,0.08)" }}
              >
                <Rocket className="h-7 w-7" style={{ color: "#FF4907" }} />
              </div>
            </div>
            <h2 className="mb-6 text-3xl font-bold text-zinc-900 sm:text-4xl">
              {XGOO_BRAND_FOUNDATION.vision.quote}
            </h2>
            <div className="space-y-4 text-left leading-relaxed text-zinc-500 sm:text-center">
              {XGOO_BRAND_FOUNDATION.vision.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden py-24"
        style={{ background: "linear-gradient(135deg,#391305 0%,#1a0802 100%)" }}
      >
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <SectionLabel>
            <span className="text-[#FF4907]">Join the Movement</span>
          </SectionLabel>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Move with purpose
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/60">
            {XGOO_BRAND_FOUNDATION.mission.quote}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => navigate("/book")}
              className="gap-2 border-0 px-8 text-white"
              style={{ background: "#FF4907" }}
            >
              Book a Parcel <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

import { Link, useLocation } from "wouter";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageSeo } from "@/components/seo/PageSeo";
import { getLegalDocument, LEGAL_DOCUMENTS } from "@/components/marketing/legal-content";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import { SEO_PAGES, buildBreadcrumbJsonLd } from "@/lib/seo";
import NotFound from "@/pages/not-found";

const LEGAL_SEO_BY_SLUG: Record<string, typeof SEO_PAGES.terms> = {
  terms: SEO_PAGES.terms,
  privacy: SEO_PAGES.privacy,
  "return-policy": SEO_PAGES.returnPolicy,
  "shipping-policy": SEO_PAGES.shippingPolicy,
  "cancellation-policy": SEO_PAGES.cancellationPolicy,
};

export default function LegalPage() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, "").split("?")[0];
  const doc = getLegalDocument(slug);
  const seo = LEGAL_SEO_BY_SLUG[slug];

  if (!doc || !seo) {
    return <NotFound />;
  }

  return (
    <MarketingLayout mainClassName="pt-28 pb-16">
      <PageSeo
        {...seo}
        description={doc.summary}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: doc.title, path: seo.path },
        ])}
      />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8" itemScope itemType="https://schema.org/WebPage">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-3 text-sm text-gray-500">Last updated: {doc.lastUpdated}</p>
        <p className="mt-4 text-base leading-relaxed text-gray-600">{doc.summary}</p>

        <div className="mt-10 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-gray-900">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.heading}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm font-medium text-gray-900">Need help?</p>
          <p className="mt-1 text-sm text-gray-600">
            Email{" "}
            <a href={`mailto:${XGOO_CONTACT.email}`} className="text-[#FF4907] hover:underline">
              {XGOO_CONTACT.email}
            </a>{" "}
            or call {XGOO_CONTACT.phone}.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {LEGAL_DOCUMENTS.filter((item) => item.slug !== doc.slug).map((item) => (
              <Link key={item.slug} href={`/${item.slug}`} className="text-gray-500 hover:text-[#FF4907]">
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}

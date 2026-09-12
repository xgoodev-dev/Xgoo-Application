export type CourierRouteKind = "country" | "city" | "service";

export type CourierRouteCity = {
  name: string;
  /** Reserved for future city landing pages. */
  href?: string;
};

export type CourierRouteFaq = {
  q: string;
  a: string;
};

export type CourierRouteBenefit = {
  title: string;
  text: string;
};

export type CourierRouteSection = {
  heading: string;
  paragraphs: string[];
};

export type CourierRoute = {
  slug: string;
  kind: CourierRouteKind;
  originCity: string;
  originSlug: string;
  countryName: string;
  countryCode: string;
  /** Natural phrase: "the USA", "Australia" */
  destinationPhrase: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  heroSupport: string;
  keywords: string[];
  intro: string[];
  reasonsHeading: string;
  reasons: string[];
  destinationSections: CourierRouteSection[];
  citiesHeading: string;
  cities: CourierRouteCity[];
  shipmentTypes: string[];
  benefits: CourierRouteBenefit[];
  faqs: CourierRouteFaq[];
  relatedSlugs: string[];
  ctaQuote: string;
  ctaBook: string;
  analyticsRoute: string;
};

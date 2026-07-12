/**
 * XGoo Brand Foundation — single source of truth for marketing copy.
 * Source: docs/brand/XGoo-Brand-Foundation.pdf (Sanjeev Nihal S, July 9 2026)
 * Prefer these statements over inventing new brand language.
 */

export const XGOO_BRAND_FOUNDATION = {
  documentTitle: "XGoo Brand Foundation",
  documentSubtitle: "Purpose | Principles | Vision | Mission",
  author: "Sanjeev Nihal S",
  dated: "July 9 2026",

  coreIdea: {
    label: "Core Idea",
    title: "Movement",
    summary: "Movement is the foundation of XGoo.",
    paragraphs: [
      "Movement is the foundation of XGoo. We believe every form of progress begins when something moves. It could be a parcel, a product, a business, an idea, or an opportunity.",
      "Movement is more than transportation. It represents growth, connection, commerce, innovation, and human progress.",
      "Our goal is to remove friction from movement and make it smarter, simpler, faster, and more meaningful.",
      "As XGoo grows, the meaning of movement will grow with it, from logistics today to enabling global commerce and future ecosystems.",
    ],
  },

  brandBelief: {
    label: "Brand Belief",
    /** Canonical quote from the Brand Foundation */
    quote: "We believe movement creates progress, and innovation makes progress possible.",
    paragraphs: [
      "Every shipment, transaction, and connection has the potential to create value for someone.",
      "Innovation is how we continuously improve movement by making it simpler, more intelligent, more reliable, and more accessible.",
      "This belief guides every product, partnership, and decision we make.",
    ],
  },

  purpose: {
    label: "Purpose",
    quote: "To empower progress through movement and innovation.",
    paragraphs: [
      "Our purpose defines why XGoo exists beyond making deliveries.",
      "We exist to help people and businesses grow by removing barriers that slow progress.",
      "Whether we are helping a family send a package or enabling a business to reach new markets, our purpose remains the same.",
    ],
  },

  vision: {
    label: "Vision",
    quote: "To become the world's most trusted movement platform.",
    paragraphs: [
      "We envision a future where movement is seamless, intelligent, and trusted.",
      "XGoo aims to become the platform people and businesses rely on whenever they need to move goods, opportunities, or commerce.",
      "Our vision inspires us to build solutions that scale globally while earning trust every day.",
    ],
  },

  mission: {
    label: "Mission",
    quote:
      "We simplify movement through innovative technology, trusted partnerships, and exceptional experiences.",
    paragraphs: [
      "Our mission explains what we do every day.",
      "We build technology that removes complexity, work with trusted partners to expand our capabilities, and design experiences that customers enjoy using.",
      "Every improvement we make should help movement become simpler, faster, safer, and more dependable.",
    ],
  },

  principles: [
    {
      number: 1,
      title: "Customer Before Convenience",
      summary: "Put customer value before internal convenience.",
    },
    {
      number: 2,
      title: "Movement First",
      summary: "Build solutions that help people and businesses move forward.",
    },
    {
      number: 3,
      title: "Innovate with Purpose",
      summary: "Solve meaningful problems through innovation.",
    },
    {
      number: 4,
      title: "Trust is Earned",
      summary: "Be honest, transparent, and accountable.",
    },
    {
      number: 5,
      title: "Keep It Simple",
      summary: "Make complex processes easy to understand and use.",
    },
    {
      number: 6,
      title: "Think Long Term",
      summary: "Prioritize lasting impact over short term gains.",
    },
    {
      number: 7,
      title: "Grow Together",
      summary: "Succeed with customers, partners, employees, and communities.",
    },
    {
      number: 8,
      title: "Own the Outcome",
      summary: "Take responsibility for results.",
    },
    {
      number: 9,
      title: "Never Stop Improving",
      summary: "Learn from every experience.",
    },
    {
      number: 10,
      title: "Move with Purpose",
      summary: "Ensure every action contributes to meaningful progress.",
    },
  ],
} as const;

/** Short lines for heroes, CTAs, and meta — derived only from the foundation. */
export const XGOO_BRAND_VOICE = {
  heroHeadline: "Movement creates progress",
  heroAccent: "Innovation makes it possible",
  heroSupport:
    "XGoo removes friction from movement — making courier booking smarter, simpler, faster, and more meaningful.",
  aboutTeaser: XGOO_BRAND_FOUNDATION.purpose.quote,
  missionOneLiner: XGOO_BRAND_FOUNDATION.mission.quote,
  visionOneLiner: XGOO_BRAND_FOUNDATION.vision.quote,
  beliefOneLiner: XGOO_BRAND_FOUNDATION.brandBelief.quote,
} as const;

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
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
    label: "Core Idea",
    title: "Movement",
    tagline: "Movement is the foundation of XGoo.",
    paragraphs: [
      "We believe every form of progress begins when something moves. It could be a parcel, a product, a business, an idea, a service, or an opportunity.",
      "Movement is more than transportation. It represents growth, connection, commerce, innovation, and human progress.",
      "Our purpose is to remove friction from movement and make it smarter, simpler, faster, and more meaningful through innovation.",
      "As XGoo evolves, so will our definition of movement. Today we simplify logistics. Tomorrow we will enable the movement of commerce, businesses, ideas, and opportunities across the world.",
    ],
  },
  {
    id: "brand-belief",
    icon: Sparkles,
    label: "Brand Belief",
    title: "Movement creates progress. Innovation makes progress possible.",
    paragraphs: [
      "We believe every movement has the power to create progress.",
      "Every shipment helps a business grow. Every delivery strengthens a relationship. Every product reaching a customer creates an opportunity. Every innovation removes barriers and unlocks new possibilities.",
      "Innovation is not our destination. It is how we continuously improve movement and create better experiences for everyone.",
      "This belief guides every product we build, every partnership we create, and every decision we make.",
    ],
  },
  {
    id: "purpose",
    icon: Heart,
    label: "Purpose",
    title: "To empower progress through movement and innovation.",
    paragraphs: [
      "Our purpose defines why XGoo exists.",
      "We exist to help people and businesses move forward by removing the barriers that slow progress.",
      "Whether we are helping a family send an important package, enabling a small business to reach customers across the country, or building technology that transforms logistics, our purpose remains the same.",
      "Everything we build should empower people to achieve more through better movement.",
    ],
  },
  {
    id: "vision",
    icon: Eye,
    label: "Vision",
    title: "To become the world's most trusted movement platform.",
    paragraphs: [
      "We envision a future where movement is seamless, intelligent, reliable, and accessible to everyone.",
      "A future where people and businesses no longer worry about how things move because XGoo makes it simple.",
      "Our vision is to become the trusted platform that powers the movement of goods, commerce, businesses, opportunities, and future innovations across the world.",
      "Trust will always be the foundation of our growth.",
    ],
  },
  {
    id: "mission",
    icon: Target,
    label: "Mission",
    title: "We simplify movement through innovative technology, trusted partnerships, and exceptional experiences.",
    paragraphs: [
      "Our mission explains what we do every day.",
      "We build technology that removes complexity. We create partnerships that expand possibilities. We design experiences that customers love.",
      "Every product, feature, and service we create should make movement simpler, smarter, faster, safer, and more reliable.",
    ],
  },
];

const principles = [
  {
    number: 1,
    title: "Customer Before Convenience",
    description:
      "Our customers are the reason we exist. Every decision should create value for our customers before creating convenience for ourselves. We listen carefully, solve problems quickly, and always act in the customer's best interest.",
  },
  {
    number: 2,
    title: "Movement First",
    description:
      "Everything we build should help people, businesses, or communities move forward. If it does not create meaningful movement, it should not exist. Movement is our purpose and our responsibility.",
  },
  {
    number: 3,
    title: "Innovate with Purpose",
    description:
      "Innovation should solve real problems. We do not innovate because it is exciting. We innovate because it improves lives, creates value, and removes friction. Every innovation must have a meaningful purpose.",
  },
  {
    number: 4,
    title: "Trust is Earned",
    description:
      "Trust is built through honesty, transparency, reliability, and accountability. We keep our promises. We communicate openly. We take responsibility for our actions. Trust is our most valuable asset.",
  },
  {
    number: 5,
    title: "Keep It Simple",
    description:
      "Complexity creates friction. We believe great products should feel simple, intuitive, and effortless. If something can be made simpler, we continue improving until it is.",
  },
  {
    number: 6,
    title: "Think Long Term",
    description:
      "We build for decades, not quarters. Every decision should strengthen the future of XGoo, our customers, our partners, and our communities. Long-term impact is more important than short-term success.",
  },
  {
    number: 7,
    title: "Grow Together",
    description:
      "Success is never achieved alone. We grow alongside our customers, employees, partners, suppliers, and communities. When they succeed, we succeed. Shared growth creates lasting relationships.",
  },
  {
    number: 8,
    title: "Own the Outcome",
    description:
      "Ownership means taking responsibility beyond assigned tasks. We solve problems instead of assigning blame. We take initiative, deliver results, and continuously improve our work.",
  },
  {
    number: 9,
    title: "Never Stop Improving",
    description:
      "Every experience teaches us something. Every challenge is an opportunity to improve. We learn continuously, adapt quickly, and strive to become better every single day. Progress is a continuous journey.",
  },
  {
    number: 10,
    title: "Move with Purpose",
    description:
      "Every action should have meaning — every shipment, conversation, decision, and innovation. Every movement should create value and contribute to meaningful progress.",
  },
];

const philosophySummary = [
  "Movement is the foundation of progress.",
  "Progress creates opportunity.",
  "Opportunity changes lives.",
  "Innovation accelerates progress.",
  "Trust sustains progress.",
];

const promiseItems = [
  "We promise to make movement simple, trusted, and meaningful.",
  "We promise to innovate with purpose.",
  "We promise to earn trust through every interaction.",
  "We promise to create solutions that help people and businesses move forward.",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: "#FF4907" }}>
      {children}
    </span>
  );
}

export default function AboutPage() {
  const [, navigate] = useLocation();

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gray-50">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-widest">
            About XGoo
          </Badge>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight max-w-4xl leading-[1.1]">
            Building the future of{" "}
            <span style={{ color: "#FF4907" }}>movement</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-3xl leading-relaxed">
            XGoo is not simply building a logistics company. We are building a movement platform — where every parcel,
            product, business, and idea can move forward with less friction and more purpose.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionLabel>Our Story</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Every form of progress begins when something moves
            </h2>
            <div className="space-y-4 text-gray-500 leading-relaxed">
              <p>
                XGoo was founded on a simple conviction: movement is the foundation of progress. What started as helping
                people and businesses send parcels has grown into a broader mission — to remove the friction that slows
                movement and make it smarter, simpler, and more meaningful.
              </p>
              <p>
                We saw families waiting to send important packages. We saw small businesses struggling to reach customers
                beyond their city. We saw courier offices working hard with tools that had not kept pace. XGoo was built
                to change that — with technology, trusted partnerships, and experiences designed around real human needs.
              </p>
              <p>
                Today, we simplify logistics. Tomorrow, we will enable the movement of commerce, businesses, ideas, and
                opportunities across the world. Our story is still being written — and we invite you to be part of it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section id="philosophy" className="py-16 sm:py-20 bg-gray-50 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <SectionLabel>Our Philosophy</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Movement creates progress. Innovation makes it possible.
            </h2>
          </div>
          <div className="space-y-6">
            {philosophyItems.map((item) => (
              <Card key={item.id} id={item.id} className="border border-gray-100 bg-white scroll-mt-32">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(255,73,7,0.08)" }}
                    >
                      <item.icon className="h-6 w-6" style={{ color: "#FF4907" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                      {item.tagline && (
                        <p className="text-gray-700 font-medium mb-3">{item.tagline}</p>
                      )}
                      <div className="space-y-3">
                        {item.paragraphs.map((paragraph, index) => (
                          <p key={index} className="text-gray-500 leading-relaxed">
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

      {/* Our Principles */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionLabel>Our Principles</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What guides every decision we make</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {principles.map((principle) => (
              <Card
                key={principle.number}
                className="border border-gray-100 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: "#FF4907" }}
                    >
                      {principle.number}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">{principle.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{principle.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="py-16 sm:py-20 bg-gray-50 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
            <div>
              <SectionLabel>Why We Exist</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Our Promise</h2>
              <ul className="space-y-4">
                {promiseItems.map((item) => (
                  <li key={item} className="flex gap-3 text-gray-600 leading-relaxed">
                    <Compass className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#FF4907" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-gray-500 leading-relaxed font-medium">
                Because when movement becomes better, progress becomes possible.
              </p>
            </div>
            <Card className="border border-gray-100 shadow-sm">
              <CardContent className="p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-5" style={{ background: "rgba(255,73,7,0.08)" }}>
                  <Lightbulb className="h-6 w-6" style={{ color: "#FF4907" }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">The XGoo Philosophy</h3>
                <div className="space-y-3">
                  {philosophySummary.map((line) => (
                    <p key={line} className="text-gray-600 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
                <p className="mt-6 text-gray-500 leading-relaxed border-t pt-6">
                  At XGoo, we are not simply building a logistics company. We are building the future of movement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Future of XGoo */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <SectionLabel>The Future of XGoo</SectionLabel>
            <div className="flex justify-center mb-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,73,7,0.08)" }}
              >
                <Rocket className="h-7 w-7" style={{ color: "#FF4907" }} />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              The world&apos;s most trusted movement platform
            </h2>
            <div className="space-y-4 text-gray-500 leading-relaxed text-left sm:text-center">
              <p>
                We envision a future where movement is seamless, intelligent, reliable, and accessible to everyone — a
                future where people and businesses no longer worry about how things move because XGoo makes it simple.
              </p>
              <p>
                As XGoo evolves, so will our definition of movement. Today we simplify logistics. Tomorrow we will
                power the movement of goods, commerce, businesses, opportunities, and future innovations across the
                world. Trust will always be the foundation of our growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join the Movement */}
      <section
        className="relative py-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg,#391305 0%,#1a0802 100%)" }}
      >
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionLabel>
            <span className="text-[#FF4907]">Join the Movement</span>
          </SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Be part of something that moves forward
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            Whether you are sending your first parcel, growing a business, or partnering with us — every movement
            creates progress. Join XGoo and move with purpose.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/book")}
              className="gap-2 px-8 text-white border-0"
              style={{ background: "#FF4907" }}
            >
              Book a Parcel <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white"
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

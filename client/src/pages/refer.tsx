import { useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { Gift, Landmark, Share2, Truck } from "lucide-react";
import { formatReferralRupees } from "@shared/referral";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageSeo } from "@/components/seo/PageSeo";
import { XGOO_BRAND_FOUNDATION } from "@/components/marketing/brand-foundation";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { captureReferralFromSearch, rememberReferralCode } from "@/lib/referral";
import { SEO_PAGES, buildBreadcrumbJsonLd } from "@/lib/seo";

type PublicProgram = {
  isActive: boolean;
  commissionType: "percent" | "flat";
  commissionValue: string;
  minPayoutAmount: string;
};

function rateCopy(program?: PublicProgram) {
  if (!program) return "Command sets the live commission for every paid courier.";
  if (program.commissionType === "flat") {
    return `${formatReferralRupees(program.commissionValue)} when the person you refer pays an accepted quote.`;
  }
  return `${program.commissionValue}% of the paid quote when the person you refer actually sends a courier.`;
}

export function ReferralCodeRedirectPage() {
  const params = useParams<{ code?: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (params.code) rememberReferralCode(params.code);
    const next = params.code ? `/refer?ref=${encodeURIComponent(params.code)}` : "/refer";
    setLocation(next);
  }, [params.code, setLocation]);

  return null;
}

export default function ReferPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();

  useEffect(() => {
    captureReferralFromSearch(search);
  }, [search]);

  const programQuery = useQuery({
    queryKey: ["/api/public/referral/program"],
    queryFn: async () => {
      const res = await fetch("/api/public/referral/program");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { message?: string }).message || "Program unavailable");
      return json as PublicProgram;
    },
  });

  const program = programQuery.data;

  return (
    <MarketingLayout>
      <PageSeo
        {...SEO_PAGES.refer}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Refer and earn", path: "/refer" },
        ])}
      />
      <section className="bg-zinc-950 px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Referral partners</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Share movement. Earn when it actually moves.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/70">
            Anyone can join — {XGOO_MODULES.go.name}, {XGOO_MODULES.pro.name}, or a public visitor. Refer
            individuals or businesses. You earn only after they send a courier and pay the quote.
          </p>
          <p className="mt-3 text-sm text-white/55">{XGOO_BRAND_FOUNDATION.brandBelief.quote}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              className="bg-[#FF4907] hover:bg-[#e54106]"
              onClick={() => setLocation("/book?mode=login")}
            >
              Join from {XGOO_MODULES.go.name} or {XGOO_MODULES.pro.name}
            </Button>
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setLocation("/book")}>
              Book a parcel
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border-zinc-200 p-5 shadow-none">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Live rate</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{rateCopy(program)}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {program
              ? `Minimum payout ${formatReferralRupees(program.minPayoutAmount)}. ${program.isActive ? "The program is open." : "Command has paused new earnings."}`
              : "Rates are set in XGoo Command."}
          </p>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Step
            icon={Share2}
            title="Share your link"
            body="Join from Profile, then send your personal link to anyone who needs to move a parcel."
          />
          <Step
            icon={Truck}
            title="They send a courier"
            body="When the referred person books and pays the accepted quote, the earning is created."
          />
          <Step
            icon={Landmark}
            title="Get paid to your bank"
            body="Add your account. Command transfers the amount and marks the payout when it is sent."
          />
        </div>
      </section>
    </MarketingLayout>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Gift;
  title: string;
  body: string;
}) {
  return (
    <Card className="border-zinc-200 p-5 shadow-none">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF4907]/10 text-[#FF4907]">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-base font-bold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">{body}</p>
    </Card>
  );
}

import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { XgooGradientPanelPatterns } from "@/components/auth/XgooAuthPattern";
import { ProductAttribution } from "@/components/marketing/ProductAttribution";
import { TechPartnerCredit } from "@/components/marketing/TechPartnerCredit";
import { XGOO_BRAND } from "@/components/marketing/site-info";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

const PARTNERS = ["FedEx", "Blue Dart", "Delhivery", "DTDC", "UPS"];

function VisualPanel({ officeName }: { officeName?: string }) {
  return (
    <div className="hidden lg:flex w-[55%] xl:w-[58%] items-stretch p-6 xl:p-8 bg-white">
      <div
        className={cn(
          "relative flex flex-1 flex-col justify-end overflow-hidden",
          "bg-gradient-to-br from-[#e8325a] via-[#ff4907] to-[#ffb347]",
        )}
      >
        <XgooGradientPanelPatterns />
        <div className="relative z-10 p-10 xl:p-14 pb-12">
          <h2 className="text-3xl xl:text-[2.75rem] font-bold text-white leading-tight tracking-tight">
            Book a pickup
            <br />
            from anywhere
          </h2>
          <p className="mt-4 max-w-md text-base text-white/85 leading-relaxed">
            {officeName
              ? `Sign in to book with ${officeName}. Track every shipment from pickup to delivery.`
              : "Sign in to book courier pickups, save addresses, and track every shipment."}
          </p>
          <div className="mt-10 pt-8 border-t border-white/20">
            <p className="text-sm font-medium text-white/70 mb-4">Trusted courier partners</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {PARTNERS.map((name) => (
                <span key={name} className="text-sm font-semibold text-white/95 tracking-wide">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerAuthShell({
  title,
  subtitle,
  officeName,
  children,
}: {
  title: string;
  subtitle?: string;
  officeName?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen bg-white text-stone-900 [color-scheme:light]"
      data-customer-auth-page
    >
      <div className="flex w-full lg:w-[45%] xl:w-[42%] flex-col min-h-screen">
        <header className="flex items-center justify-between bg-white px-8 py-7 sm:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 object-contain" />
            <div>
              <span className="text-2xl font-bold tracking-tight text-[#FF4907] block leading-none">
                {XGOO_BRAND.productName}
              </span>
              <span className="text-[10px] text-stone-400">from {XGOO_BRAND.parentCompany}</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-[#FF4907] transition-colors"
          >
            Home
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 py-8">
          <div className="mx-auto w-full max-w-[400px]">
            <h1 className="text-[2rem] sm:text-[2.125rem] font-bold tracking-tight text-stone-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 mb-8 text-sm text-stone-500 leading-relaxed">{subtitle}</p>
            )}
            {!subtitle && <div className="mb-8" />}
            {children}
          </div>
        </main>

        <footer className="px-8 py-8 sm:px-12">
          <p className="text-xs text-stone-400 leading-relaxed max-w-md">
            <Link href="/privacy" className="hover:text-stone-600">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/terms" className="hover:text-stone-600">
              Terms & Conditions
            </Link>
            {" · "}
            <Link href="/contact" className="hover:text-stone-600">
              Support
            </Link>
          </p>
          <p className="mt-2 text-xs text-stone-400">
            <ProductAttribution variant="subtle" className="!text-stone-400" />
          </p>
          <TechPartnerCredit className="mt-4" />
        </footer>
      </div>
      <VisualPanel officeName={officeName} />
    </div>
  );
}

export const customerAuthFieldClass = cn(
  "h-[52px] rounded-none border-0 bg-[#f5f3f2] text-stone-900 shadow-none",
  "placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-[#FF4907]/40 focus-visible:bg-[#faf8f7]",
);

export const customerAuthPrimaryButtonClass = cn(
  "h-[52px] w-full rounded-none text-base font-semibold",
  "bg-[#FF4907] hover:bg-[#e03d00] text-white shadow-none",
);

export const customerAuthSecondaryButtonClass = cn(
  "h-[48px] w-full rounded-none border border-stone-200 bg-white text-stone-800",
  "hover:bg-stone-50 shadow-none",
);

export const customerAuthGoogleButtonClass = cn(
  "h-[52px] w-full rounded-none border border-stone-300 bg-white text-stone-900",
  "hover:bg-stone-50 shadow-none gap-3 [&_svg]:size-5",
);

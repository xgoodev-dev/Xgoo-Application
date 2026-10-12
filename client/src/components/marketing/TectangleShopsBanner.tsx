import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { XGOO_TECH_PARTNER } from "@/components/marketing/site-info";
import tectangleBlack from "@assets/Tectangle-black-logo-full.png";

type TectangleShopsBannerProps = {
  className?: string;
  compact?: boolean;
};

export function TectangleShopsRunner({ className }: { className?: string }) {
  const shops = XGOO_TECH_PARTNER.shops;
  const message = `${shops.title} — ${shops.cta}`;
  const items = Array.from({ length: 6 }, () => message);

  return (
    <a
      href={shops.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center bg-[#FFD400] text-zinc-900 no-underline transition-opacity hover:opacity-95",
        className,
      )}
      data-testid="banner-tectangle-shops-runner"
      aria-label={`${shops.title}. ${shops.cta}`}
    >
      <span className="ml-3 flex h-7 shrink-0 items-center rounded-md bg-white px-2">
        <img
          src={tectangleBlack}
          alt={XGOO_TECH_PARTNER.name}
          className="h-4 w-auto max-w-[110px] object-contain object-right"
        />
      </span>
      <div className="min-w-0 flex-1 overflow-hidden py-2 text-xs font-semibold tracking-wide sm:text-sm">
        <div className="flex w-max animate-marquee">
          {[...items, ...items].map((text, i) => (
            <span key={i} className="mx-6 whitespace-nowrap">
              {text} <span className="opacity-50">•</span>
            </span>
          ))}
        </div>
      </div>
      <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[#FFD400]">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

export function TectangleShopsBanner({ className, compact = false }: TectangleShopsBannerProps) {
  const shops = XGOO_TECH_PARTNER.shops;

  return (
    <a
      href={shops.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block overflow-hidden rounded-xl border border-zinc-200 bg-[#111111] text-left no-underline shadow-sm transition-opacity hover:opacity-95",
        className,
      )}
      data-testid="banner-tectangle-shops"
      aria-label={`${shops.title}. ${shops.cta}`}
    >
      <div className="flex items-center justify-between gap-3 bg-[#FFD400] px-3 py-2">
        <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-900">
          {shops.eyebrow}
        </p>
        <span className="flex h-7 shrink-0 items-center rounded-md bg-white px-2">
          <img
            src={tectangleBlack}
            alt={XGOO_TECH_PARTNER.name}
            className="h-4 w-auto max-w-[120px] object-contain object-right"
          />
        </span>
      </div>
      <div className={cn("flex items-center gap-3 px-3", compact ? "py-2.5" : "py-3.5")}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-white">{shops.title}</p>
          {compact ? null : <p className="mt-1 text-xs leading-relaxed text-white/70">{shops.body}</p>}
          <p className="mt-1.5 text-xs font-semibold text-[#FFD400]">{shops.cta}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFD400] text-zinc-900">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </a>
  );
}
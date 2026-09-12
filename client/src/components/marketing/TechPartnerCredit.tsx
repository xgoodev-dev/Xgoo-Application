import { cn } from "@/lib/utils";
import { XGOO_TECH_PARTNER } from "./site-info";
import tectangleBlack from "@assets/Tectangle-black-logo-full.png";
import tectangleWhite from "@assets/Tectangle-white-logo-full.png";

type TechPartnerCreditProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function TechPartnerCredit({ variant = "light", className }: TechPartnerCreditProps) {
  const dark = variant === "dark";
  return (
    <div
      className={cn(
        "flex w-full flex-nowrap items-center justify-center gap-2.5 text-center",
        className,
      )}
      data-testid="tech-partner-credit"
    >
      <p
        className={cn(
          "shrink-0 text-[11px] font-medium tracking-wide",
          dark ? "text-white/45" : "text-zinc-500",
        )}
      >
        {XGOO_TECH_PARTNER.credit}
      </p>
      <a
        href={XGOO_TECH_PARTNER.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        aria-label={`${XGOO_TECH_PARTNER.name} — ${XGOO_TECH_PARTNER.website}`}
      >
        <img
          src={dark ? tectangleWhite : tectangleBlack}
          alt={XGOO_TECH_PARTNER.name}
          className="h-6 w-auto max-w-[132px] object-contain"
        />
        <span className={cn("text-[11px] font-medium", dark ? "text-white/55" : "text-zinc-500")}>
          {XGOO_TECH_PARTNER.website}
        </span>
      </a>
    </div>
  );
}

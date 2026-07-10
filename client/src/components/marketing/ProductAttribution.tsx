import { cn } from "@/lib/utils";
import { XGOO_BRAND } from "./site-info";

type ProductAttributionProps = {
  variant?: "footer" | "footer-dark" | "inline" | "subtle" | "badge";
  className?: string;
};

export function ProductAttribution({ variant = "footer", className }: ProductAttributionProps) {
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-[#FF4907]/25 bg-[#FF4907]/5 px-3 py-1 text-xs font-medium text-[#9B320B]",
          className,
        )}
      >
        {XGOO_BRAND.attributionShort}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <p className={cn("text-base text-gray-500 leading-relaxed", className)}>
        {XGOO_BRAND.attributionInline}.
      </p>
    );
  }

  if (variant === "subtle") {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>{XGOO_BRAND.attributionShort}</p>
    );
  }

  if (variant === "footer-dark") {
    return (
      <p className={cn("text-xs text-white/35 text-center sm:text-right", className)}>
        {XGOO_BRAND.copyright()}
      </p>
    );
  }

  return (
    <p className={cn("text-xs text-muted-foreground text-center sm:text-left", className)}>
      {XGOO_BRAND.copyright()}
    </p>
  );
}

import type { ReactNode } from "react";
import { CourierRouteBreadcrumbs, type Crumb } from "@/components/marketing/courier-routes/CourierRouteBreadcrumbs";
import { DirectPickupForm, type DirectPickupDefaults } from "@/components/marketing/DirectPickupForm";
import { cn } from "@/lib/utils";

const ORANGE = "#FF4907";

type ServicesHeroProps = {
  image: string;
  imageAlt: string;
  crumbs: Crumb[];
  eyebrow: string;
  title: ReactNode;
  support: string;
  actions?: ReactNode;
  highlights?: { label: string; icon?: ReactNode }[];
  pickupDefaults?: DirectPickupDefaults;
  pickupTitle?: string;
  analyticsCategory?: string;
  showPickup?: boolean;
};

function pickupFormTitle(defaults?: DirectPickupDefaults, override?: string) {
  if (override) return override;
  if (defaults?.destinationCountry) return `Book Shipment to ${defaults.destinationCountry}`;
  if (defaults?.shipmentType === "international") return "Book International Shipment";
  if (defaults?.shipmentType === "domestic") return "Book Domestic Shipment";
  return "Book Shipment";
}

export function ServicesHero({
  image,
  imageAlt,
  crumbs,
  eyebrow,
  title,
  support,
  actions,
  highlights,
  pickupDefaults,
  pickupTitle,
  analyticsCategory,
  showPickup = true,
}: ServicesHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={image} alt={imageAlt} className="h-full w-full object-cover object-[65%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
      </div>
      <div
        className={cn(
          "relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:items-start lg:gap-12 lg:px-8 lg:py-20",
          showPickup && "lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]",
        )}
      >
        <div>
          <CourierRouteBreadcrumbs items={crumbs} tone="light" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            <span style={{ color: ORANGE }}>{eyebrow}</span>
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/75 sm:text-lg">
            {support}
          </p>
          {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
          {highlights?.length ? (
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              {highlights.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {showPickup ? (
          <DirectPickupForm
            compact
            title={pickupFormTitle(pickupDefaults, pickupTitle)}
            defaults={pickupDefaults}
            analyticsCategory={analyticsCategory}
            className={cn("lg:sticky lg:top-28")}
          />
        ) : null}
      </div>
    </section>
  );
}

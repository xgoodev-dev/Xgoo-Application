import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { courierRoutePath, type CourierRoute } from "./index";

const ORANGE = "#FF4907";

export function RelatedRoutes({
  routes,
  heading = "Related courier routes",
}: {
  routes: CourierRoute[];
  heading?: string;
}) {
  if (routes.length === 0) return null;

  return (
    <section className="border-t border-zinc-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>
          More destinations
        </p>
        <h2 className="mt-3 text-[1.7rem] font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
          {heading}
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-500">
          Courier pickup from Hyderabad is also available for these international destinations.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map((route) => (
            <Link
              key={route.slug}
              href={courierRoutePath(route.slug)}
              className="group rounded-md border border-zinc-100 bg-zinc-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Hyderabad to
              </p>
              <p className="mt-1 text-lg font-bold text-zinc-900">{route.countryName}</p>
              <p className="mt-2 text-sm text-zinc-500">
                Documents and parcels from Hyderabad to {route.destinationPhrase}.
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition group-hover:gap-2"
                style={{ color: ORANGE }}
              >
                View route <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

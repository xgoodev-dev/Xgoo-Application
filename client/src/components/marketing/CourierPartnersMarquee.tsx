import { COURIER_PARTNER_BRANDS } from "./courier-partners";

function PartnerLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <div
      title={name}
      className="flex h-[72px] min-w-[148px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-100 bg-white p-2 shadow-sm sm:h-[104px] sm:min-w-[220px] sm:p-3"
    >
      <img
        src={logo}
        alt={`${name} logo`}
        className="h-full w-full max-h-[72px] max-w-[196px] object-contain sm:max-h-[88px]"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

export function CourierPartnersMarquee() {
  const track = [...COURIER_PARTNER_BRANDS, ...COURIER_PARTNER_BRANDS];

  return (
    <section className="overflow-hidden border-y border-zinc-100 bg-zinc-50 py-10 sm:py-16">
      <div className="mx-auto mb-10 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF4907]">
          Supported Courier Networks
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
          Trusted partners for every shipment
        </h2>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-zinc-50 to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-zinc-50 to-transparent sm:w-24" />

        <div className="flex w-max animate-marquee items-center gap-6 sm:gap-8">
          {track.map((partner, index) => (
            <PartnerLogo key={`${partner.name}-${index}`} name={partner.name} logo={partner.logo} />
          ))}
        </div>
      </div>
    </section>
  );
}

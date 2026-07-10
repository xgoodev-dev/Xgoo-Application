import { COURIER_PARTNER_BRANDS } from "./courier-partners";

function PartnerLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-sm h-[88px] sm:h-[104px] min-w-[180px] sm:min-w-[220px]"
      title={name}
    >
      <img
        src={logo}
        alt={`${name} logo`}
        className="h-10 sm:h-12 w-auto max-w-[160px] object-contain grayscale-[20%] hover:grayscale-0 transition-all duration-300"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

export function CourierPartnersMarquee() {
  const track = [...COURIER_PARTNER_BRANDS, ...COURIER_PARTNER_BRANDS];

  return (
    <section className="bg-gray-50 py-14 sm:py-16 border-y overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Supported Courier Networks
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Trusted partners for every shipment
        </h2>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24 bg-gradient-to-r from-gray-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24 bg-gradient-to-l from-gray-50 to-transparent" />

        <div className="flex w-max animate-marquee items-center gap-6 sm:gap-8">
          {track.map((partner, index) => (
            <PartnerLogo key={`${partner.name}-${index}`} name={partner.name} logo={partner.logo} />
          ))}
        </div>
      </div>
    </section>
  );
}

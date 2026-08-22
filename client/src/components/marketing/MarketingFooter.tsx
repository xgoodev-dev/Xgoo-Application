import { useLocation } from "wouter";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { ProductAttribution } from "./ProductAttribution";
import { XGOO_BRAND, XGOO_CONTACT } from "./site-info";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const COMPANY_LINKS: FooterLink[] = [
  { label: "Book a Parcel", href: "/book" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Staff Login", href: "/auth-page" },
];

const POLICY_LINKS: FooterLink[] = [
  { label: "Terms and Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

function FooterNavLink({
  link,
  onNavigate,
}: {
  link: FooterLink;
  onNavigate: (href: string) => void;
}) {
  if (link.external || link.href.startsWith("http") || link.href.startsWith("mailto:")) {
    return (
      <a href={link.href} className="text-sm text-white/45 transition-colors hover:text-white">
        {link.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onNavigate(link.href)}
      className="text-left text-sm text-white/45 transition-colors hover:text-white"
    >
      {link.label}
    </button>
  );
}

export function MarketingFooter() {
  const [, navigate] = useLocation();

  return (
    <footer className="border-t border-white/10 pb-28 pt-12 sm:py-14" style={{ background: "#141414" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <img src={xgooLogo} alt="XGoo" className="h-10 w-10 rounded-lg" />
              <div className="text-left">
                <span className="block text-xl font-extrabold text-white">{XGOO_BRAND.productName}</span>
                <span className="block text-xs text-white/40">from {XGOO_BRAND.parentCompany}</span>
              </div>
            </button>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
              We simplify movement through innovative technology, trusted partnerships, and
              exceptional experiences.
            </p>
            <div className="mt-4 space-y-1 text-sm text-white/45">
              <a href={`mailto:${XGOO_CONTACT.email}`} className="block break-all hover:text-white">
                {XGOO_CONTACT.email}
              </a>
              <a
                href={`tel:${XGOO_CONTACT.phone.replace(/\s/g, "")}`}
                className="block hover:text-white"
              >
                Phone {XGOO_CONTACT.phone}
              </a>
              <a
                href={`https://wa.me/${XGOO_CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-medium text-[#FF4907] hover:text-[#ff6a33]"
              >
                WhatsApp {XGOO_CONTACT.whatsappDisplay}
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/55">Company</h3>
            <nav className="mt-4 flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <FooterNavLink key={link.href} link={link} onNavigate={navigate} />
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/55">Policies</h3>
            <nav className="mt-4 flex flex-col gap-2.5">
              {POLICY_LINKS.map((link) => (
                <FooterNavLink key={link.href} link={link} onNavigate={navigate} />
              ))}
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/55">Support</h3>
            <nav className="mt-4 flex flex-col gap-2.5">
              <FooterNavLink link={{ label: "Help & Contact", href: "/contact" }} onNavigate={navigate} />
              <FooterNavLink link={{ label: "Book Online", href: "/book" }} onNavigate={navigate} />
              <a
                href={`mailto:${XGOO_CONTACT.email}?subject=XGoo%20Support`}
                className="text-sm text-white/45 transition-colors hover:text-white"
              >
                Email Support
              </a>
              <p className="pt-1 text-xs leading-relaxed text-white/35">{XGOO_CONTACT.hours}</p>
              <p className="text-xs leading-relaxed text-white/35">{XGOO_CONTACT.address}</p>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <ProductAttribution variant="footer-dark" className="sm:text-left" />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/35">
            {POLICY_LINKS.slice(0, 3).map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => navigate(link.href)}
                className="hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

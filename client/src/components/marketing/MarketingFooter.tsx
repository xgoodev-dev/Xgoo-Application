import { useLocation } from "wouter";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { ProductAttribution } from "./ProductAttribution";
import { XGOO_BRAND } from "./site-info";

export function MarketingFooter() {
  const [, navigate] = useLocation();

  return (
    <footer className="py-10 border-t" style={{ background: "#0d0401" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <img src={xgooLogo} alt="XGoo" className="h-7 w-7 rounded-lg" />
            <div className="text-left">
              <span className="font-bold text-white text-lg block">{XGOO_BRAND.productName}</span>
              <span className="text-xs text-white/40 block">from {XGOO_BRAND.parentCompany}</span>
            </div>
          </button>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center text-sm text-white/40">
            <button type="button" onClick={() => navigate("/book")} className="hover:text-white transition-colors">
              Book
            </button>
            <button type="button" onClick={() => navigate("/about")} className="hover:text-white transition-colors">
              About Us
            </button>
            <button type="button" onClick={() => navigate("/contact")} className="hover:text-white transition-colors">
              Contact
            </button>
            <a href="/auth-page" className="hover:text-white transition-colors">
              Staff Login
            </a>
          </div>
          <ProductAttribution variant="footer-dark" />
        </div>
      </div>
    </footer>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ArrowUpRight, Menu } from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { XGOO_BRAND } from "./site-info";
import { LaunchingSoonRunner } from "./LaunchingSoonRunner";

const SCROLL_TO_SECTION_KEY = "xgoo_scroll_to_section";

export function consumePendingSectionScroll(): string | null {
  const section = sessionStorage.getItem(SCROLL_TO_SECTION_KEY);
  if (section) sessionStorage.removeItem(SCROLL_TO_SECTION_KEY);
  return section;
}

type MarketingHeaderProps = {
  /** @deprecated All main nav links are always shown. */
  showSectionLinks?: boolean;
};

export function MarketingHeader(_props: MarketingHeaderProps = {}) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const pathOnly = location.split("?")[0] || "/";
  const isActive = (path: string) => pathOnly === path;

  const goTo = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const goToSection = (sectionId: string) => {
    setMenuOpen(false);
    if (pathOnly === "/") {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", `#${sectionId}`);
      return;
    }
    sessionStorage.setItem(SCROLL_TO_SECTION_KEY, sectionId);
    navigate("/");
  };

  const linkClass = (active: boolean) =>
    `text-left hover:text-gray-900 transition-colors ${active ? "text-gray-900" : ""}`;

  const navLinks = (
    <>
      <button type="button" onClick={() => goTo("/")} className={linkClass(isActive("/"))}>
        Home
      </button>
      <button
        type="button"
        onClick={() => goToSection("how-it-works")}
        className="text-left hover:text-gray-900 transition-colors"
      >
        How It Works
      </button>
      <button
        type="button"
        onClick={() => goToSection("features")}
        className="text-left hover:text-gray-900 transition-colors"
      >
        Features
      </button>
      <button type="button" onClick={() => goTo("/about")} className={linkClass(isActive("/about"))}>
        About Us
      </button>
      <button
        type="button"
        onClick={() => goTo("/contact")}
        className={linkClass(isActive("/contact"))}
      >
        Contact
      </button>
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <LaunchingSoonRunner />
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity min-w-0"
          >
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-lg shrink-0" />
            <div className="min-w-0 text-left">
              <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate block">
                {XGOO_BRAND.productName}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 truncate block">
                from {XGOO_BRAND.parentCompany}
              </span>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-gray-500">
            {navLinks}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate("/book")}
              className="bg-[#FF4907] hover:bg-[#e03d00] text-white gap-1 border-0"
            >
              <span className="sm:hidden">Book</span>
              <span className="hidden sm:inline">Book a Parcel</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden shrink-0"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4 text-base font-medium text-gray-600">
                  {navLinks}
                  <button
                    type="button"
                    onClick={() => goTo("/book")}
                    className="text-left hover:text-gray-900 transition-colors"
                  >
                    Book a Parcel
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}

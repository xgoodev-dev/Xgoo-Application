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
    `text-left transition-colors hover:text-zinc-900 ${active ? "text-zinc-900" : ""}`;

  const navLinks = (
    <>
      <button type="button" onClick={() => goTo("/")} className={linkClass(isActive("/"))}>
        Home
      </button>
      <button
        type="button"
        onClick={() => goToSection("how-it-works")}
        className="text-left hover:text-zinc-900 transition-colors"
      >
        How It Works
      </button>
      <button
        type="button"
        onClick={() => goToSection("features")}
        className="text-left hover:text-zinc-900 transition-colors"
      >
        Services
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
      <nav className="border-b border-zinc-100 bg-white shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90 sm:gap-3"
          >
            <img
              src={xgooLogo}
              alt="XGoo"
              className="h-12 w-12 shrink-0 rounded-xl sm:h-14 sm:w-14"
            />
            <div className="min-w-0 text-left">
              <span className="block truncate text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
                {XGOO_BRAND.productName}
              </span>
              <span className="block truncate text-[11px] text-zinc-400 sm:text-sm">
                from {XGOO_BRAND.parentCompany}
              </span>
            </div>
          </button>

          <div className="hidden items-center gap-6 text-sm font-medium text-zinc-500 lg:flex xl:gap-8">
            {navLinks}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/book?mode=login")}
              className="hidden sm:inline-flex rounded-none border-zinc-200 font-medium text-zinc-700 hover:text-[#FF4907]"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/book")}
              className="gap-1 rounded-none border-0 bg-[#FF4907] px-4 font-semibold text-white hover:bg-[#e03d00]"
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
                  className="lg:hidden shrink-0 rounded-none"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4 text-base font-medium text-zinc-600">
                  {navLinks}
                  <button
                    type="button"
                    onClick={() => goTo("/book?mode=login")}
                    className="text-left font-medium text-zinc-800 transition-colors hover:text-[#FF4907]"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo("/book")}
                    className="text-left font-semibold text-[#FF4907] transition-colors hover:text-[#e03d00]"
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

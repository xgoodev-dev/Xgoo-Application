import { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, Menu, PackageSearch } from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { XGOO_BRAND, XGOO_CUSTOMER_MODULES } from "./site-info";
import { LaunchingSoonRunner } from "./LaunchingSoonRunner";
import { TrackingSidebar } from "./TrackingSidebar";
import {
  COURIER_ROUTE_PREFIX,
  DOMESTIC_COURIER_PATH,
  INTERNATIONAL_COURIER_PATH,
  courierRoutePath,
  listPublishedCourierRoutes,
} from "./courier-routes";

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

const SERVICE_HUB_LINKS = [
  { label: "International Courier", href: INTERNATIONAL_COURIER_PATH },
  { label: "Domestic Courier", href: DOMESTIC_COURIER_PATH },
] as const;

export function MarketingHeader(_props: MarketingHeaderProps = {}) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackCollapsed, setTrackCollapsed] = useState(false);

  const trackExpanded = trackOpen && !trackCollapsed;

  const openTracking = () => {
    setMenuOpen(false);
    setTrackCollapsed(false);
    setTrackOpen(true);
  };

  const pathOnly = location.split("?")[0] || "/";
  const isActive = (path: string) => pathOnly === path;
  const routePages = listPublishedCourierRoutes();
  const isServicesActive =
    pathOnly === INTERNATIONAL_COURIER_PATH ||
    pathOnly === DOMESTIC_COURIER_PATH ||
    pathOnly.startsWith(COURIER_ROUTE_PREFIX);

  const goTo = (path: string) => {
    setMenuOpen(false);
    setMobileServicesOpen(false);
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

  const servicesTriggerClass = `${linkClass(isServicesActive)} inline-flex items-center gap-1`;

  const desktopNav = (
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
      <DropdownMenu>
        <DropdownMenuTrigger className={`${servicesTriggerClass} outline-none`}>
          Services
          <ChevronDown className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 rounded-md border-zinc-100 p-2 shadow-lg">
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Courier services
          </DropdownMenuLabel>
          {SERVICE_HUB_LINKS.map((link) => (
            <DropdownMenuItem
              key={link.href}
              className={`cursor-pointer ${isActive(link.href) ? "text-[#FF4907]" : ""}`}
              onSelect={() => goTo(link.href)}
            >
              {link.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Courier from Hyderabad
          </DropdownMenuLabel>
          {routePages.map((route) => {
            const href = courierRoutePath(route.slug);
            return (
              <DropdownMenuItem
                key={route.slug}
                className={`cursor-pointer ${isActive(href) ? "text-[#FF4907]" : ""}`}
                onSelect={() => goTo(href)}
              >
                Hyderabad to {route.countryName}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
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

  const mobileNav = (
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
      <div>
        <button
          type="button"
          onClick={() => setMobileServicesOpen((open) => !open)}
          className={`${servicesTriggerClass} w-full`}
          aria-expanded={mobileServicesOpen}
        >
          Services
          <ChevronDown className={`h-4 w-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileServicesOpen ? (
          <div className="mt-3 ml-3 flex flex-col gap-3 border-l border-zinc-100 pl-3 text-sm">
            {SERVICE_HUB_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => goTo(link.href)}
                className={linkClass(isActive(link.href))}
              >
                {link.label}
              </button>
            ))}
            <p className="pt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              From Hyderabad
            </p>
            {routePages.map((route) => {
              const href = courierRoutePath(route.slug);
              return (
                <button
                  key={route.slug}
                  type="button"
                  onClick={() => goTo(href)}
                  className={linkClass(isActive(href))}
                >
                  Hyderabad to {route.countryName}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
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
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <LaunchingSoonRunner />
      <nav className="border-b border-zinc-100 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:h-20 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90 sm:gap-3"
          >
            <img
              src={xgooLogo}
              alt="XGoo"
              className="h-10 w-10 shrink-0 rounded-xl sm:h-14 sm:w-14"
            />
            <div className="min-w-0 text-left">
              <span className="block truncate text-lg font-extrabold tracking-tight text-zinc-900 sm:text-2xl">
                {XGOO_BRAND.productName}
              </span>
              <span className="block truncate text-[10px] text-zinc-400 sm:text-sm">
                from {XGOO_BRAND.parentCompany}
              </span>
            </div>
          </button>

          <div className="hidden items-center gap-6 text-sm font-medium text-zinc-500 lg:flex xl:gap-8">
            {desktopNav}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openTracking}
              className="gap-1.5 rounded-none border-zinc-200 font-medium text-zinc-700 hover:text-[#FF4907]"
              aria-expanded={trackExpanded}
              aria-controls="tracking-sidebar-panel"
              data-testid="button-header-track"
            >
              <PackageSearch className="h-3.5 w-3.5" />
              Track
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="hidden whitespace-nowrap rounded-none border-0 bg-[#FF4907] font-semibold text-white hover:bg-[#e03d00] sm:inline-flex"
                  data-testid="button-header-sign-in"
                >
                  Sign In
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-md border-zinc-100 p-2 shadow-lg">
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Sign in
                </DropdownMenuLabel>
                {XGOO_CUSTOMER_MODULES.map((module) => (
                  <DropdownMenuItem
                    key={module.id}
                    className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                    onClick={() => navigate(module.path)}
                    data-testid={`link-sign-in-${module.id}`}
                  >
                    <span className="font-semibold text-zinc-900">{module.name}</span>
                    <span className="text-xs text-zinc-500">{module.meaning}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
              <SheetContent side="right" className="w-full max-w-xs">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4 text-base font-medium text-zinc-600">
                  {mobileNav}
                  <button
                    type="button"
                    onClick={openTracking}
                    className="text-left font-medium text-zinc-800 transition-colors hover:text-[#FF4907]"
                  >
                    Track
                  </button>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Sign in</p>
                  {XGOO_CUSTOMER_MODULES.map((module) => (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => goTo(module.path)}
                      className="text-left"
                      data-testid={`link-mobile-sign-in-${module.id}`}
                    >
                      <span className="block font-semibold text-[#FF4907]">{module.name}</span>
                      <span className="block text-sm font-normal text-zinc-500">{module.meaning}</span>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      <TrackingSidebar
        open={trackOpen}
        collapsed={trackCollapsed}
        onOpenChange={(open) => {
          setTrackOpen(open);
          if (!open) setTrackCollapsed(false);
        }}
        onCollapsedChange={setTrackCollapsed}
      />
      {!trackExpanded && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              onClick={openTracking}
              className="fixed right-0 top-1/2 z-[60] flex -translate-y-1/2 items-center gap-2 rounded-l-md bg-[#FF4907] py-3 pl-3 pr-3 text-white shadow-lg shadow-[#FF4907]/30 transition hover:bg-[#e03d00] hover:pr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4907] focus-visible:ring-offset-2"
              aria-expanded={trackExpanded}
              aria-controls="tracking-sidebar-panel"
              data-testid="button-floating-track"
            >
              <PackageSearch className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">Track</span>
            </button>,
            document.body,
          )
        : null}
    </header>
  );
}

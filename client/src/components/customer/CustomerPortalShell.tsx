import { useState } from "react";
import { Link } from "wouter";
import {
  ClipboardList,
  Clock,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  Search,
  Truck,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { LocationChip } from "@/components/location-chip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";

const ACCENT = "#FF4907";
const SIDEBAR_BG = "#1A1A1A";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type CustomerPortalShellProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  userSubtitle?: string;
  isGuest?: boolean;
  showTrack?: boolean;
  /** Go workspace: Home dashboard like the mobile app. */
  showHome?: boolean;
  /** Hide Account nav for guests (default true when not guest). */
  showAccount?: boolean;
  /** Business workspace: Today / Destinations / Schedule instead of one-off Book. */
  isBusiness?: boolean;
  onLogout?: () => void;
  onSignIn?: () => void;
  onHelp?: () => void;
  officePhone?: string;
  locationFallback?: string | null;
  /** XGoo Pro store / business name shown next to the logo. */
  businessName?: string | null;
  /** Hide booking when this Go/Pro account is outside the Hub service range. */
  coverageLocked?: boolean;
  children: React.ReactNode;
};

function initialsFromName(name?: string) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SidebarNav({
  activeTab,
  onTabChange,
  showTrack,
  showHome,
  showAccount = true,
  isBusiness,
  coverageLocked,
  onNavigate,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTrack?: boolean;
  showHome?: boolean;
  showAccount?: boolean;
  isBusiness?: boolean;
  coverageLocked?: boolean;
  onNavigate?: () => void;
}) {
  const items: NavItem[] = coverageLocked
    ? [
        ...(showTrack ? [{ id: "track", label: "Track", icon: Search } as NavItem] : []),
        { id: "help", label: "Help", icon: HelpCircle },
      ]
    : isBusiness
    ? [
        { id: "home", label: "Dashboard", icon: LayoutDashboard },
        { id: "orders", label: "Orders", icon: ClipboardList },
        { id: "customers", label: "Customers", icon: Users },
        { id: "pickup", label: "Pickup", icon: Package },
        { id: "bookings", label: "Shipments", icon: Truck },
        { id: "bills", label: "Bills", icon: Receipt },
        { id: "schedule", label: "Schedule", icon: Clock },
        ...(showAccount ? [{ id: "account", label: "Profile", icon: User } as NavItem] : []),
      ]
    : [
        ...(showHome ? [{ id: "home", label: "Home", icon: Home } as NavItem] : []),
        { id: "book", label: "Book", icon: Plus },
        ...(showTrack ? [{ id: "track", label: "Track", icon: Search } as NavItem] : []),
        { id: "bookings", label: "Shipments", icon: Truck },
        ...(showAccount ? [{ id: "account", label: "Profile", icon: User } as NavItem] : []),
      ];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" data-testid="customer-portal-nav">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onTabChange(item.id);
              onNavigate?.();
            }}
            data-testid={`nav-${item.id}`}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-[#FF4907]"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <Icon
              className={cn("h-5 w-5 shrink-0", active ? "text-[#FF4907]" : "text-zinc-500")}
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarBrand({ isBusiness, businessName }: { isBusiness?: boolean; businessName?: string | null }) {
  const product = isBusiness ? XGOO_MODULES.pro : XGOO_MODULES.go;
  const storeLabel = businessName?.trim();
  return (
    <div className="flex items-center gap-2.5 px-5 py-6">
      <img src={xgooLogo} alt={product.name} className="h-9 w-9 object-contain shrink-0" />
      <div className="min-w-0">
        <span className="block text-xl font-bold leading-none tracking-tight text-white">
          {product.name}
        </span>
        <span className="mt-1 block truncate text-[10px] text-zinc-500" title={storeLabel || product.meaning}>
          {storeLabel || product.meaning}
        </span>
      </div>
    </div>
  );
}

function SidebarFooter({
  userName,
  userSubtitle,
  isGuest,
  onLogout,
  onSignIn,
  onNavigate,
  onHelp,
}: {
  userName?: string;
  userSubtitle?: string;
  isGuest?: boolean;
  onLogout?: () => void;
  onSignIn?: () => void;
  onNavigate?: () => void;
  onHelp?: () => void;
}) {
  const displayName = userName?.trim() || (isGuest ? "Guest" : "Customer");
  const subtitle = userSubtitle ?? (isGuest ? "Guest" : "Customer");

  return (
    <div className="mt-auto border-t border-white/10 px-3 pb-4 pt-3">
      {onHelp ? (
        <button
          type="button"
          onClick={() => {
            onHelp();
            onNavigate?.();
          }}
          data-testid="nav-help"
          className="mb-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
        >
          <HelpCircle className="h-5 w-5 shrink-0 text-zinc-500" />
          Help
        </button>
      ) : (
      <Link
        href="/contact"
        onClick={onNavigate}
        data-testid="nav-help"
        className="mb-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
      >
        <HelpCircle className="h-5 w-5 shrink-0 text-zinc-500" />
        Help
      </Link>
      )}

      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: ACCENT }}
          aria-hidden
        >
          {initialsFromName(displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white" data-testid="text-user-name">
            {displayName}
          </p>
          <p className="truncate text-xs text-zinc-500">{subtitle}</p>
        </div>
        {isGuest ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              onSignIn?.();
              onNavigate?.();
            }}
            className="h-8 shrink-0 px-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
            data-testid="button-sign-in"
          >
            Sign in
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onLogout?.();
              onNavigate?.();
            }}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
            aria-label="Log out"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarBody({
  activeTab,
  onTabChange,
  userName,
  userSubtitle,
  isGuest,
  showTrack,
  showHome,
  showAccount = true,
  isBusiness,
  coverageLocked,
  onLogout,
  onSignIn,
  onHelp,
  officePhone,
  businessName,
  onNavigate,
}: Omit<CustomerPortalShellProps, "children"> & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: SIDEBAR_BG }}>
      <SidebarBrand isBusiness={isBusiness} businessName={businessName} />
      <SidebarNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        showTrack={showTrack}
        showHome={showHome}
        showAccount={showAccount}
        isBusiness={isBusiness}
        coverageLocked={coverageLocked}
        onNavigate={onNavigate}
      />
      {officePhone && (
        <p className="px-5 pb-2 text-[11px] text-zinc-600">
          Office ·{" "}
          <a href={`tel:${officePhone.replace(/\s/g, "")}`} className="text-zinc-400 hover:text-zinc-200">
            {officePhone}
          </a>
        </p>
      )}
      <SidebarFooter
        userName={userName}
        userSubtitle={userSubtitle}
        isGuest={isGuest}
        onLogout={onLogout}
        onSignIn={onSignIn}
        onNavigate={onNavigate}
        onHelp={onHelp}
      />
    </div>
  );
}

export function CustomerPortalShell({
  activeTab,
  onTabChange,
  userName,
  userSubtitle,
  isGuest,
  showTrack,
  showHome,
  showAccount = true,
  isBusiness,
  coverageLocked,
  onLogout,
  onSignIn,
  onHelp,
  officePhone,
  locationFallback,
  businessName,
  children,
}: CustomerPortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const storeLabel = businessName?.trim();

  return (
    <div
      className="flex h-full max-h-full min-h-0 w-full overflow-hidden bg-[#F4F4F5] [color-scheme:light]"
      data-testid="customer-portal-shell"
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden h-full w-60 shrink-0 md:flex md:flex-col"
        style={{ backgroundColor: SIDEBAR_BG }}
        data-testid="customer-portal-sidebar"
      >
        <SidebarBody
          activeTab={activeTab}
          onTabChange={onTabChange}
          userName={userName}
          userSubtitle={userSubtitle}
          isGuest={isGuest}
          showTrack={showTrack}
          showHome={showHome}
          showAccount={showAccount}
          isBusiness={isBusiness}
          coverageLocked={coverageLocked}
          onLogout={onLogout}
          onSignIn={onSignIn}
          onHelp={onHelp}
          officePhone={officePhone}
          businessName={businessName}
        />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(100%,16rem)] border-0 p-0 sm:max-w-[15rem]"
          style={{ backgroundColor: SIDEBAR_BG }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody
            activeTab={activeTab}
            onTabChange={onTabChange}
            userName={userName}
            userSubtitle={userSubtitle}
            isGuest={isGuest}
            showTrack={showTrack}
            showHome={showHome}
            showAccount={showAccount}
            isBusiness={isBusiness}
            coverageLocked={coverageLocked}
            onLogout={onLogout}
            onSignIn={onSignIn}
            onHelp={onHelp}
            officePhone={officePhone}
            businessName={businessName}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F4F4F5]">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200/80 bg-white px-3 sm:gap-3 sm:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-zinc-700 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            data-testid="button-open-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <img src={xgooLogo} alt="" className="h-7 w-7 object-contain md:hidden" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight text-zinc-900 md:hidden">
                {isBusiness ? storeLabel || XGOO_MODULES.pro.name : XGOO_MODULES.go.name}
              </span>
              {isBusiness && storeLabel ? (
                <span
                  className="hidden truncate text-sm font-semibold text-zinc-900 md:block"
                  data-testid="header-business-name"
                >
                  {storeLabel}
                </span>
              ) : null}
            </div>
          </div>
          <LocationChip
            fallback={locationFallback}
            compact
            className="ml-auto hidden max-w-[10rem] sm:inline-flex sm:max-w-xs"
          />
        </header>

        <main
          className={cn(
            "min-h-0 flex-1 overflow-hidden",
            isBusiness && !coverageLocked && "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0",
          )}
        >
          {children}
        </main>

        {isBusiness && !coverageLocked ? (
          <nav
            className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            data-testid="pro-mobile-tabbar"
          >
            <div className="grid h-[4.25rem] grid-cols-5">
              {(
                [
                  { id: "home", label: "Home", icon: LayoutDashboard },
                  { id: "orders", label: "Orders", icon: ClipboardList },
                  { id: "pickup", label: "Pickup", icon: Package },
                  { id: "bookings", label: "Shipments", icon: Truck },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                      active ? "text-[#FF4907]" : "text-zinc-500",
                    )}
                    data-testid={`tabbar-${item.id}`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  ["customers", "bills", "schedule", "account"].includes(activeTab)
                    ? "text-[#FF4907]"
                    : "text-zinc-500",
                )}
                data-testid="tabbar-more"
              >
                <MoreHorizontal className="h-5 w-5" />
                More
              </button>
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

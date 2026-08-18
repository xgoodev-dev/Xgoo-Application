import { useState } from "react";
import { Link } from "wouter";
import {
  HelpCircle,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Truck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { XGOO_BRAND } from "@/components/marketing/site-info";
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
  /** Hide Account nav for guests (default true when not guest). */
  showAccount?: boolean;
  onLogout?: () => void;
  onSignIn?: () => void;
  officePhone?: string;
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
  showAccount = true,
  onNavigate,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showTrack?: boolean;
  showAccount?: boolean;
  onNavigate?: () => void;
}) {
  const items: NavItem[] = [
    { id: "book", label: "Book", icon: Plus },
    { id: "bookings", label: "Shipments", icon: Truck },
    ...(showTrack ? [{ id: "track", label: "Track", icon: Search } as NavItem] : []),
    ...(showAccount ? [{ id: "account", label: "Account", icon: User } as NavItem] : []),
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

function SidebarBrand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-6">
      <img src={xgooLogo} alt="XGoo" className="h-9 w-9 object-contain shrink-0" />
      <div className="min-w-0">
        <span className="block text-xl font-bold leading-none tracking-tight text-white">
          {XGOO_BRAND.productName}
        </span>
        <span className="mt-1 block text-[10px] text-zinc-500">
          from {XGOO_BRAND.parentCompany}
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
}: {
  userName?: string;
  userSubtitle?: string;
  isGuest?: boolean;
  onLogout?: () => void;
  onSignIn?: () => void;
  onNavigate?: () => void;
}) {
  const displayName = userName?.trim() || (isGuest ? "Guest" : "Customer");
  const subtitle = userSubtitle ?? (isGuest ? "Guest" : "Customer");

  return (
    <div className="mt-auto border-t border-white/10 px-3 pb-4 pt-3">
      <Link
        href="/contact"
        onClick={onNavigate}
        data-testid="nav-help"
        className="mb-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
      >
        <HelpCircle className="h-5 w-5 shrink-0 text-zinc-500" />
        Help
      </Link>

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
  showAccount = true,
  onLogout,
  onSignIn,
  officePhone,
  onNavigate,
}: Omit<CustomerPortalShellProps, "children"> & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: SIDEBAR_BG }}>
      <SidebarBrand />
      <SidebarNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        showTrack={showTrack}
        showAccount={showAccount}
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
  showAccount = true,
  onLogout,
  onSignIn,
  officePhone,
  children,
}: CustomerPortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          showAccount={showAccount}
          onLogout={onLogout}
          onSignIn={onSignIn}
          officePhone={officePhone}
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
            showAccount={showAccount}
            onLogout={onLogout}
            onSignIn={onSignIn}
            officePhone={officePhone}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F4F4F5]">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-white px-4 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-zinc-700"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            data-testid="button-open-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={xgooLogo} alt="" className="h-7 w-7 object-contain" />
            <span className="text-base font-bold tracking-tight text-zinc-900">
              {XGOO_BRAND.productName}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
            <Package className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            Portal
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

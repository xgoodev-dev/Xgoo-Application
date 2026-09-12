import type { ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Clock,
  LogOut,
  MapPinned,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TechPartnerCredit } from "@/components/marketing/TechPartnerCredit";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { SavedAddressesManager } from "@/components/customer/SavedAddresses";
import { GoHelpSupport } from "./GoHelpSupport";
import { GoNotifications } from "./GoHome";
import { GoPrivacySecurity } from "./GoPrivacySecurity";

export type GoProfileView =
  | "menu"
  | "personal"
  | "addresses"
  | "privacy"
  | "notifications"
  | "help";

function initialsFromName(name?: string) {
  if (!name?.trim()) return "XG";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function GoProfile({
  token,
  userName,
  userPhone,
  userEmail,
  view,
  onViewChange,
  personalPanel,
  onOpenBooking,
  onLogout,
  module = "go",
  onOpenSchedule,
  onOpenDestinations,
}: {
  token: string;
  userName?: string;
  userPhone?: string | null;
  userEmail?: string | null;
  view: GoProfileView;
  onViewChange: (view: GoProfileView) => void;
  personalPanel: ReactNode;
  onOpenBooking?: (id: string) => void;
  onLogout?: () => void;
  module?: "go" | "pro";
  onOpenSchedule?: () => void;
  onOpenDestinations?: () => void;
}) {
  const product = module === "pro" ? XGOO_MODULES.pro : XGOO_MODULES.go;
  switch (view) {
    case "personal":
      return (
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
          <button
            type="button"
            onClick={() => onViewChange("menu")}
            className="mb-4 text-sm font-medium text-zinc-500"
          >
            ← Back
          </button>
          {personalPanel}
        </div>
      );
    case "addresses":
      return (
        <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
          <button
            type="button"
            onClick={() => onViewChange("menu")}
            className="mb-4 text-sm font-medium text-zinc-500"
          >
            ← Back
          </button>
          <h2 className="mb-4 text-xl font-bold text-zinc-900">Saved addresses</h2>
          <SavedAddressesManager token={token} />
        </div>
      );
    case "privacy":
      return <GoPrivacySecurity token={token} module={module} onBack={() => onViewChange("menu")} />;
    case "notifications":
      return (
        <GoNotifications
          token={token}
          onBack={() => onViewChange("menu")}
          onOpenBooking={onOpenBooking}
        />
      );
    case "help":
      return <GoHelpSupport module={module} onBack={() => onViewChange("menu")} />;
    case "menu":
      break;
    default: {
      const _exhaustive: never = view;
      return _exhaustive;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <h2 className="text-xl font-bold text-zinc-900">Profile</h2>
      <p className="mt-1 text-sm text-zinc-500">Your {product.name} customer account.</p>
      <Card className="mt-5 flex items-center gap-4 border-zinc-100 p-4 shadow-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF4907] text-lg font-extrabold text-white">
          {initialsFromName(userName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-zinc-900">{userName}</p>
          {userPhone ? <p className="text-sm text-zinc-500">{userPhone}</p> : null}
          {userEmail ? <p className="text-sm text-zinc-500">{userEmail}</p> : null}
        </div>
      </Card>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Account</p>
      <Card className="mt-2 divide-y divide-zinc-100 border-zinc-100 p-0 shadow-none">
        <MenuRow
          icon={UserRound}
          label="Personal information"
          onClick={() => onViewChange("personal")}
        />
        <MenuRow
          icon={MapPinned}
          label="Saved addresses"
          onClick={() => onViewChange("addresses")}
        />
        <MenuRow
          icon={ShieldCheck}
          label="Privacy and security"
          onClick={() => onViewChange("privacy")}
        />
      </Card>

      {module === "pro" ? (
        <>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Business</p>
          <Card className="mt-2 divide-y divide-zinc-100 border-zinc-100 p-0 shadow-none">
            <MenuRow
              icon={Clock}
              label="Pickup schedule"
              onClick={() => onOpenSchedule?.()}
            />
            <MenuRow
              icon={MapPinned}
              label="Customers"
              onClick={() => onOpenDestinations?.()}
            />
          </Card>
        </>
      ) : null}

      <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Preferences</p>
      <Card className="mt-2 divide-y divide-zinc-100 border-zinc-100 p-0 shadow-none">
        <MenuRow icon={Bell} label="Notifications" onClick={() => onViewChange("notifications")} />
        <MenuRow icon={CircleHelp} label="Help and support" onClick={() => onViewChange("help")} />
      </Card>

      {onLogout ? (
        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={onLogout}
          data-testid="button-go-profile-sign-out"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      ) : null}
      <p className="mt-4 text-center text-[10px] text-zinc-400">{product.name} · Website</p>
      <TechPartnerCredit className="mt-4 pb-2" />
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-semibold text-zinc-900">{label}</span>
      <ChevronRight className="h-4 w-4 text-zinc-400" />
    </button>
  );
}

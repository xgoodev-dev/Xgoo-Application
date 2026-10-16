import {
  Building2,
  Calculator,
  ChevronRight,
  HelpCircle,
  MapPin,
  Package,
} from "lucide-react";
import type { KioskScreen, KioskLanguage } from "@shared/kiosk";
import { kioskCopy } from "./i18n";

const CARDS: Array<{
  screen: Extract<KioskScreen, "send" | "track" | "rates" | "business" | "help">;
  icon: typeof Package;
  testId: string;
  featured?: boolean;
}> = [
  { screen: "send", icon: Package, testId: "kiosk-card-send", featured: true },
  { screen: "track", icon: MapPin, testId: "kiosk-card-track" },
  { screen: "rates", icon: Calculator, testId: "kiosk-card-rates" },
  { screen: "business", icon: Building2, testId: "kiosk-card-business" },
  { screen: "help", icon: HelpCircle, testId: "kiosk-card-help" },
];

export function ServiceCards({
  language,
  active,
  onSelect,
}: {
  language: KioskLanguage;
  active?: KioskScreen;
  onSelect: (screen: (typeof CARDS)[number]["screen"]) => void;
}) {
  const copy = kioskCopy(language);
  const label = (screen: (typeof CARDS)[number]["screen"]) => {
    switch (screen) {
      case "send":
        return copy.send;
      case "track":
        return copy.track;
      case "rates":
        return copy.rates;
      case "business":
        return copy.business;
      case "help":
        return copy.help;
      default: {
        const _never: never = screen;
        return _never;
      }
    }
  };
  const sub = (screen: (typeof CARDS)[number]["screen"]) => {
    switch (screen) {
      case "send":
        return copy.sendSub;
      case "track":
        return copy.trackSub;
      case "rates":
        return copy.ratesSub;
      case "business":
        return copy.businessSub;
      case "help":
        return copy.helpSub;
      default: {
        const _never: never = screen;
        return _never;
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
      {CARDS.map((card) => {
        const on = active === card.screen || (!active && card.featured);
        return (
          <button
            key={card.screen}
            type="button"
            data-testid={card.testId}
            onClick={() => onSelect(card.screen)}
            className={`flex min-h-[6.5rem] items-center gap-3 px-4 py-3 text-left transition active:scale-[0.99] sm:min-h-[7.25rem] ${
              on
                ? "bg-[#FF4907] text-white"
                : "bg-[#141414] text-white ring-1 ring-white/10 hover:ring-[#FF4907]/50"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className={`mb-2 flex ${on ? "text-white" : "text-[#FF4907]"}`}>
                <card.icon className="h-7 w-7" strokeWidth={2.2} />
              </span>
              <span className="block text-[15px] font-bold leading-snug">{label(card.screen)}</span>
              {sub(card.screen) ? (
                <span className={`mt-0.5 block text-xs ${on ? "text-white/85" : "text-zinc-400"}`}>
                  {sub(card.screen)}
                </span>
              ) : null}
            </span>
            <ChevronRight className={`h-5 w-5 shrink-0 ${on ? "text-white/90" : "text-zinc-500"}`} />
          </button>
        );
      })}
    </div>
  );
}

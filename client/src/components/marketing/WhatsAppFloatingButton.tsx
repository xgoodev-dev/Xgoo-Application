import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { SiWhatsapp } from "react-icons/si";
import { X } from "lucide-react";
import { XGOO_BRAND, XGOO_CONTACT } from "@/components/marketing/site-info";

const STAFF_PATH_PREFIXES = [
  "/dashboard",
  "/bookings",
  "/shipments",
  "/documents",
  "/quotations",
  "/booking-requests",
  "/customers",
  "/partners",
  "/pricing",
  "/reports",
  "/settings",
];

function resolveWhatsAppNumber(): string {
  const fromEnv =
    typeof import.meta !== "undefined"
      ? String((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_WHATSAPP_NUMBER || "")
          .replace(/\D/g, "")
      : "";
  return fromEnv || XGOO_CONTACT.whatsapp.replace(/\D/g, "");
}

function isStaffPath(path: string): boolean {
  return STAFF_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function WhatsAppFloatingButton() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  if (isStaffPath(location) || !visible) return null;

  const phone = resolveWhatsAppNumber();
  if (phone.length < 10) return null;

  const prefill = "Hi";
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(prefill)}`;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="w-[min(100vw-2.5rem,320px)] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-3 bg-[#25D366] px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{XGOO_BRAND.productName} WhatsApp</p>
              <p className="mt-0.5 text-xs text-white/90">Typically replies instantly</p>
            </div>
            <button
              type="button"
              aria-label="Close WhatsApp chat preview"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 bg-[#efeae2] px-4 py-4">
            <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
              Hi! Chat with {XGOO_BRAND.productName} on WhatsApp to book a parcel, track a shipment, or
              talk to our team.
            </div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
              data-testid="link-whatsapp-bot-start"
            >
              <SiWhatsapp className="h-4 w-4" />
              Start chat
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label="Open WhatsApp chat"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 transition hover:scale-105 hover:bg-[#1ebe57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        data-testid="button-whatsapp-bot"
      >
        {open ? <X className="h-6 w-6" /> : <SiWhatsapp className="h-7 w-7" />}
      </button>
    </div>
  );
}

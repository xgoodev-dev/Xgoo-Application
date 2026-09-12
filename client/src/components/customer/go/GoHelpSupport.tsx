import { Mail, MessageCircle, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { XGOO_CONTACT } from "@/components/marketing/site-info";

export function GoHelpSupport({
  onBack,
  module = "go",
}: {
  onBack: () => void;
  module?: "go" | "pro";
}) {
  const product = module === "pro" ? "XGoo Pro" : "XGoo Go";
  const options = [
    {
      title: "Chat on WhatsApp",
      subtitle: `WhatsApp ${XGOO_CONTACT.whatsappDisplay}`,
      href: `https://wa.me/${XGOO_CONTACT.whatsapp}`,
      icon: MessageCircle,
    },
    {
      title: "Call support",
      subtitle: `${XGOO_CONTACT.phone} · ${XGOO_CONTACT.hours}`,
      href: `tel:${XGOO_CONTACT.phone.replace(/\s/g, "")}`,
      icon: Phone,
    },
    {
      title: "Email support",
      subtitle: XGOO_CONTACT.email,
      href: `mailto:${XGOO_CONTACT.email}?subject=${encodeURIComponent(`${product} Support`)}`,
      icon: Mail,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-zinc-500">
        ← Back
      </button>
      <h2 className="text-xl font-bold text-zinc-900">Help and support</h2>
      <p className="mt-1 text-sm text-zinc-500">Contact XGoo about a booking, pickup, delivery, or account.</p>
      <Card className="mt-5 border-zinc-100 bg-[#FF4907]/5 p-4 shadow-none">
        <p className="font-semibold text-zinc-900">How can we help?</p>
        <p className="mt-1 text-sm text-zinc-600">
          We keep movement simple — reach us on WhatsApp, phone, or email.
        </p>
      </Card>
      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <a
              key={option.title}
              href={option.href}
              target={option.href.startsWith("http") ? "_blank" : undefined}
              rel={option.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-[#FF4907]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-zinc-900">{option.title}</span>
                <span className="block text-sm text-zinc-500">{option.subtitle}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

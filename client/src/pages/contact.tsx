import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { ServicesHero } from "@/components/marketing/ServicesHero";
import { PageSeo } from "@/components/seo/PageSeo";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import { SEO_PAGES, buildBreadcrumbJsonLd, buildLocalBusinessJsonLd } from "@/lib/seo";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import heroImage from "@/assets/landing/hero-xgoo-delivery.jpg";

const ORANGE = "#FF4907";
const fieldClass = cn(
  "h-11 rounded-none border border-zinc-200 bg-[#f5f3f2] text-zinc-900 shadow-none",
  "placeholder:text-zinc-400",
  "focus-visible:ring-2 focus-visible:ring-[#FF4907]/35 focus-visible:border-[#FF4907]/40",
);
const areaClass = cn(fieldClass, "min-h-[8rem] h-auto resize-none py-2.5");

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }
      toast({
        title: "Message sent",
        description: data.message || "We'll get back to you shortly.",
      });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      toast({
        title: "Could not send message",
        description: error instanceof Error ? error.message : "Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactItems = [
    {
      icon: Mail,
      label: "Email",
      value: XGOO_CONTACT.email,
      href: `mailto:${XGOO_CONTACT.email}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: XGOO_CONTACT.phone,
      href: `tel:${XGOO_CONTACT.phone.replace(/\s/g, "")}`,
    },
    {
      icon: SiWhatsapp,
      label: "WhatsApp Business",
      value: XGOO_CONTACT.whatsappDisplay,
      href: `https://wa.me/${XGOO_CONTACT.whatsapp}`,
      external: true,
    },
    {
      icon: MapPin,
      label: "Office",
      value: XGOO_CONTACT.address,
    },
    {
      icon: Clock,
      label: "Hours",
      value: XGOO_CONTACT.hours,
    },
  ];

  return (
    <MarketingLayout>
      <PageSeo
        {...SEO_PAGES.contact}
        jsonLd={[
          buildLocalBusinessJsonLd(),
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <ServicesHero
        image={heroImage}
        imageAlt="XGoo team ready to help with courier booking and support"
        crumbs={[{ name: "Home", path: "/" }, { name: "Contact" }]}
        eyebrow="Contact Us"
        title={
          <>
            We&apos;re here to <span style={{ color: ORANGE }}>help</span>
          </>
        }
        support="Questions about booking, tracking, partnerships, or our platform? Reach out and our team will respond as soon as possible."
        showPickup={false}
        highlights={[
          { icon: <Phone className="h-4 w-4" style={{ color: ORANGE }} />, label: XGOO_CONTACT.phone },
          { icon: <Mail className="h-4 w-4" style={{ color: ORANGE }} />, label: XGOO_CONTACT.email },
        ]}
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              {contactItems.map((item) => (
                <Card key={item.label} className="border border-zinc-200 bg-white text-zinc-900 shadow-sm">
                  <CardContent className="flex gap-4 p-5">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(255,73,7,0.08)" }}
                    >
                      <item.icon className="h-5 w-5" style={{ color: "#FF4907" }} />
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="font-medium text-zinc-900 transition-colors hover:text-[#FF4907]"
                          {...("external" in item && item.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-medium leading-relaxed text-zinc-900">{item.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border border-zinc-200 bg-white text-zinc-900 shadow-sm lg:col-span-3">
              <CardContent className="p-6 sm:p-8">
                <h2 className="mb-1 text-xl font-bold text-zinc-900">Send us a message</h2>
                <p className="mb-6 text-sm text-zinc-500">Fill in the form below and we&apos;ll get back to you.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-zinc-800">Name</Label>
                      <Input
                        id="contact-name"
                        required
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Your name"
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-zinc-800">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="you@example.com"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-zinc-800">Phone (optional)</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+91 ..."
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject" className="text-zinc-800">Subject</Label>
                      <Input
                        id="contact-subject"
                        required
                        value={form.subject}
                        onChange={(e) => updateField("subject", e.target.value)}
                        placeholder="How can we help?"
                        className={fieldClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="text-zinc-800">Message</Label>
                    <Textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      placeholder="Tell us more about your enquiry..."
                      className={areaClass}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 text-white border-0"
                    style={{ background: "#FF4907" }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { PageSeo } from "@/components/seo/PageSeo";
import { XGOO_CONTACT } from "@/components/marketing/site-info";
import { ProductAttribution } from "@/components/marketing/ProductAttribution";
import { SEO_PAGES, buildBreadcrumbJsonLd, buildLocalBusinessJsonLd } from "@/lib/seo";
import { useToast } from "@/hooks/use-toast";
import { Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";

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
      <section className="relative overflow-hidden border-b bg-gray-50">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <span className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: "#FF4907" }}>
            Contact Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight max-w-2xl">
            We&apos;re here to <span style={{ color: "#FF4907" }}>help</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl leading-relaxed">
            Questions about booking, tracking, partnerships, or our platform? Reach out and our team will respond as
            soon as possible.
          </p>
          <div className="mt-4">
            <ProductAttribution variant="badge" />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              {contactItems.map((item) => (
                <Card key={item.label} className="border border-gray-100">
                  <CardContent className="p-5 flex gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(255,73,7,0.08)" }}
                    >
                      <item.icon className="h-5 w-5" style={{ color: "#FF4907" }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-gray-900 hover:text-[#FF4907] transition-colors font-medium">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-gray-900 font-medium leading-relaxed">{item.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="lg:col-span-3 border border-gray-100 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Send us a message</h2>
                <p className="text-sm text-gray-500 mb-6">Fill in the form below and we&apos;ll get back to you.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        required
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone (optional)</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+91 ..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject">Subject</Label>
                      <Input
                        id="contact-subject"
                        required
                        value={form.subject}
                        onChange={(e) => updateField("subject", e.target.value)}
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      placeholder="Tell us more about your enquiry..."
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

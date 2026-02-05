import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Users,
  FileText,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Building2,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Bookings",
    description:
      "Create shipments in under 60 seconds with our POS-style interface designed for speed.",
  },
  {
    icon: Users,
    title: "Customer Management",
    description:
      "Track walk-in and business customers, manage credit limits, and view complete shipment history.",
  },
  {
    icon: FileText,
    title: "Instant Invoicing",
    description:
      "Generate professional PDF invoices automatically with GST calculations and multiple payment modes.",
  },
  {
    icon: Package,
    title: "Shipment Tracking",
    description:
      "Monitor shipments from booking to delivery with clear status updates and AWB management.",
  },
  {
    icon: Shield,
    title: "Multi-Partner Support",
    description:
      "Manage DTDC, FedEx, Blue Dart, and more with custom rate cards and AWB ranges.",
  },
  {
    icon: Clock,
    title: "Real-time Reports",
    description:
      "View daily bookings, revenue, pending payments, and export detailed reports to Excel.",
  },
];

const trustBadges = [
  "Free Forever Plan",
  "No Credit Card Required",
  "Mobile-First Design",
  "Made for India",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">XGoo</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/api/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-login-nav"
            >
              Log in
            </a>
            <Button asChild data-testid="button-get-started-nav">
              <a href="/api/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
            <div
              className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary/20 to-primary/5 opacity-30"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm w-fit">
                <span className="flex h-2 w-2 rounded-full bg-green-500" />
                Now serving 500+ courier offices
              </div>
              <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Simplify Your
                <span className="block text-primary">Courier Operations</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Stop managing bookings in notebooks and WhatsApp. XGoo is the simple, fast,
                POS-style software built for small and mid-size courier offices in India.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button size="lg" asChild data-testid="button-get-started-hero">
                  <a href="/api/login">
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild data-testid="button-demo">
                  <a href="/api/login">View Demo</a>
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {trustBadges.map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-8">
              <div className="relative rounded-2xl border bg-card p-2 shadow-2xl ring-1 ring-black/5">
                <div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Today's Bookings</div>
                          <div className="text-2xl font-bold">127</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="text-xl font-semibold text-green-600">₹45,230</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["Booked", "In Transit", "Delivered"].map((status, i) => (
                        <div key={status} className="rounded-lg bg-background p-3 text-center">
                          <div className="text-lg font-semibold">{[42, 58, 27][i]}</div>
                          <div className="text-xs text-muted-foreground">{status}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: "AWB-7842", to: "Mumbai", status: "Delivered" },
                        { id: "AWB-7841", to: "Delhi", status: "In Transit" },
                        { id: "AWB-7840", to: "Chennai", status: "Booked" },
                      ].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg bg-background p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{item.id}</div>
                              <div className="text-xs text-muted-foreground">To {item.to}</div>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.status === "Delivered"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : item.status === "In Transit"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">
              Everything You Need to Run Your Office
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Indian courier offices. No complex setup, no steep learning curve.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background hover-elevate">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl mb-4">
            Ready to Modernize Your Office?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join hundreds of courier offices already using XGoo to manage their daily operations.
          </p>
          <Button size="lg" asChild data-testid="button-get-started-cta">
            <a href="/api/login">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">XGoo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} XGoo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

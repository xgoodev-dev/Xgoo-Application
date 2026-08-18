import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallExtensionButton } from "@/components/InstallExtensionButton";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import LandingPage from "@/pages/landing";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import LegalPage from "@/pages/legal";
import DashboardPage from "@/pages/dashboard";
import NewBookingPage from "@/pages/bookings/new";
import ShipmentsPage from "@/pages/shipments";
import ShipmentLabelPage from "@/pages/shipments/label";
import ShipmentInvoicePage from "@/pages/shipments/invoice";
import ShipmentBillPage from "@/pages/shipments/bill";
import ShipmentDetailPage from "@/pages/shipments/detail";
import QuotationDocumentPage from "@/pages/quotations/document";
import BookingRequestsPage from "@/pages/booking-requests";
import CustomersPage from "@/pages/customers";
import PartnersPage from "@/pages/partners";
import ReportsPage from "@/pages/reports";
import PricingPage from "@/pages/pricing";
import DocumentsPage from "@/pages/documents";
import SettingsPage from "@/pages/settings";
import CustomerPortalPage from "@/pages/customer-portal";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { WhatsAppFloatingButton } from "@/components/marketing/WhatsAppFloatingButton";

function QuotationsRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/documents/quotations");
  }, [setLocation]);
  return null;
}

function AuthenticatedApp() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden bg-background">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <InstallExtensionButton />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/bookings/new" component={NewBookingPage} />
              <Route path="/shipments" component={ShipmentsPage} />
              <Route path="/shipments/:id/label" component={ShipmentLabelPage} />
              <Route path="/shipments/:id/invoice" component={ShipmentInvoicePage} />
              <Route path="/shipments/:id/bill" component={ShipmentBillPage} />
              <Route path="/shipments/:id" component={ShipmentDetailPage} />
              <Route path="/documents" component={DocumentsPage} />
              <Route path="/documents/:tab" component={DocumentsPage} />
              <Route path="/quotations" component={QuotationsRedirect} />
              <Route path="/quotations/:id/document" component={QuotationDocumentPage} />
              <Route path="/booking-requests" component={BookingRequestsPage} />
              <Route path="/customers" component={CustomersPage} />
              <Route path="/partners" component={PartnersPage} />
              <Route path="/pricing" component={PricingPage} />
              <Route path="/reports" component={ReportsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary animate-pulse">
          <svg
            className="h-6 w-6 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function HomeRoute() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return null;
  return <LandingPage />;
}

function Router() {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={LegalPage} />
      <Route path="/privacy" component={LegalPage} />
      <Route path="/return-policy" component={LegalPage} />
      <Route path="/shipping-policy" component={LegalPage} />
      <Route path="/cancellation-policy" component={LegalPage} />
      <Route path="/auth-page" component={AuthPage} />
      <Route path="/book" component={CustomerPortalPage} />
      <Route path="/book/:slug" component={CustomerPortalPage} />
      <Route>
        {isLoading ? (
          <LoadingScreen />
        ) : !isAuthenticated ? (
          <AuthPage />
        ) : (
          <AuthenticatedApp />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <MetaPixel />
          <Router />
          <WhatsAppFloatingButton />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

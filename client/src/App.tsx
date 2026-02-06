import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import NewBookingPage from "@/pages/bookings/new";
import ShipmentsPage from "@/pages/shipments";
import ShipmentLabelPage from "@/pages/shipments/label";
import ShipmentInvoicePage from "@/pages/shipments/invoice";
import QuotationsPage from "@/pages/quotations";
import BookingRequestsPage from "@/pages/booking-requests";
import CustomersPage from "@/pages/customers";
import PartnersPage from "@/pages/partners";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import CustomerPortalPage from "@/pages/customer-portal";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b px-4 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/bookings/new" component={NewBookingPage} />
              <Route path="/shipments" component={ShipmentsPage} />
              <Route path="/shipments/:id/label" component={ShipmentLabelPage} />
              <Route path="/shipments/:id/invoice" component={ShipmentInvoicePage} />
              <Route path="/quotations" component={QuotationsPage} />
              <Route path="/booking-requests" component={BookingRequestsPage} />
              <Route path="/customers" component={CustomersPage} />
              <Route path="/partners" component={PartnersPage} />
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

function Router() {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/book/:slug" component={CustomerPortalPage} />
      <Route>
        {isLoading ? (
          <LoadingScreen />
        ) : !isAuthenticated ? (
          <LandingPage />
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
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

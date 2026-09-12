import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Users,
  Truck,
  FileText,
  Settings,
  LogOut,
  Files,
  Inbox,
  Link2,
  Copy,
  Check,
  Calculator,
} from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Office, BookingRequest } from "@shared/schema";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "New Booking", url: "/bookings/new", icon: PackagePlus },
  { title: "Shipments", url: "/shipments", icon: Package },
  { title: "Documents", url: "/documents", icon: Files },
  { title: "Booking Requests", url: "/booking-requests", icon: Inbox },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Courier Partners", url: "/partners", icon: Truck },
  { title: "Price Estimator", url: "/pricing", icon: Calculator },
  { title: "Reports", url: "/reports", icon: FileText },
];

const settingsNavItems = [{ title: "Settings", url: "/settings", icon: Settings }];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [portalCopied, setPortalCopied] = useState(false);

  const { data: office } = useQuery<Office | null>({
    queryKey: ["/api/office"],
  });
  const { data: staffAccess } = useQuery<{ isSuperAdmin: boolean }>({
    queryKey: ["/api/staff/me"],
  });

  const { data: bookingRequests } = useQuery<BookingRequest[]>({
    queryKey: ["/api/booking-requests"],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 20_000,
  });

  const pendingRequestCount =
    bookingRequests?.filter((r) => r.status === "pending" || r.status === "reviewed").length ?? 0;

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.user_metadata?.firstName
    ? `${user.user_metadata.firstName}${user.user_metadata.lastName ? ` ${user.user_metadata.lastName}` : ""}`
    : user?.email || "User";

  // Always point customers at this staff office so bookings land in Booking Requests here.
  const portalUrl = office?.publicSlug
    ? `${window.location.origin}/book/${office.publicSlug}`
    : `${window.location.origin}/book`;

  const copyPortalLink = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = portalUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={staffAccess?.isSuperAdmin ? XGOO_MODULES.command.name : XGOO_MODULES.hub.name}
            >
              <Link href="/" data-testid="link-home">
                <img src={xgooLogo} alt="XGoo" className="size-8 shrink-0 object-contain" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {staffAccess?.isSuperAdmin ? XGOO_MODULES.command.name : XGOO_MODULES.hub.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {staffAccess?.isSuperAdmin
                      ? XGOO_MODULES.command.meaning
                      : XGOO_MODULES.hub.meaning}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={
                      item.url === "/documents"
                        ? location.startsWith("/documents")
                        : location === item.url
                    }
                  >
                    <Link
                      href={item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      className="relative"
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                      {item.url === "/booking-requests" && pendingRequestCount > 0 && (
                        <span
                          className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4907] px-1.5 text-[10px] font-bold text-white"
                          data-testid="badge-pending-booking-requests"
                        >
                          {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{XGOO_MODULES.go.name} / {XGOO_MODULES.pro.shortName}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={copyPortalLink}
                  tooltip={portalCopied ? "Link Copied!" : `Copy ${XGOO_MODULES.go.name} / ${XGOO_MODULES.pro.shortName} link`}
                  data-testid="button-sidebar-copy-portal"
                >
                  {portalCopied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
                  <span>{portalCopied ? "Link Copied!" : `Copy ${XGOO_MODULES.go.shortName} / ${XGOO_MODULES.pro.shortName} link`}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={`Open ${XGOO_MODULES.go.name}`}>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-open-portal"
                  >
                    <Link2 className="size-4 shrink-0" />
                    <span>Open {XGOO_MODULES.go.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {staffAccess?.isSuperAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={location === item.url}>
                      <Link
                        href={item.url}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={displayName} className="cursor-default">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-muted text-primary text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email || ""}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log out" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="size-4 shrink-0" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

import { useState } from "react";
import { useLocation, Link } from "wouter";
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
import { XGOO_BRAND } from "@/components/marketing/site-info";
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

  const portalUrl = `${window.location.origin}/book`;

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
            <SidebarMenuButton size="lg" asChild tooltip="XGoo — Home">
              <Link href="/" data-testid="link-home">
                <img src={xgooLogo} alt="XGoo" className="size-8 shrink-0 object-contain" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{XGOO_BRAND.productName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {XGOO_BRAND.parentCompany}
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

        <SidebarGroup>
          <SidebarGroupLabel>Booking Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={copyPortalLink}
                  tooltip={portalCopied ? "Link Copied!" : "Copy Portal Link"}
                  data-testid="button-sidebar-copy-portal"
                >
                  {portalCopied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
                  <span>{portalCopied ? "Link Copied!" : "Copy Portal Link"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Open Portal">
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="link-open-portal"
                  >
                    <Link2 className="size-4 shrink-0" />
                    <span>Open Portal</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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

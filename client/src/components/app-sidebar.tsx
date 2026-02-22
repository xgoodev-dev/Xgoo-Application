import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  FileText,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import {
  FileSpreadsheet,
  Inbox,
  Link2,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { Office } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "New Booking",
    url: "/bookings/new",
    icon: Package,
  },
  {
    title: "Shipments",
    url: "/shipments",
    icon: Package,
  },
  {
    title: "Quotations",
    url: "/quotations",
    icon: FileSpreadsheet,
  },
  {
    title: "Booking Requests",
    url: "/booking-requests",
    icon: Inbox,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Courier Partners",
    url: "/partners",
    icon: Truck,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
];

const settingsNavItems = [
  {
    title: "Office Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [portalCopied, setPortalCopied] = useState(false);

  const { data: office } = useQuery<Office>({
    queryKey: ["/api/office"],
  });

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

  const portalUrl = office?.publicSlug
    ? `${window.location.origin}/book/${office.publicSlug}`
    : null;

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

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-3">
            <img src={xgooLogo} alt="XGoo" className="h-10 w-10 rounded-lg" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold">XGoo</span>
              <span className="text-xs text-muted-foreground">Courier Management</span>
            </div>
          </div>
        </Link>
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
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {portalUrl && (
          <SidebarGroup>
            <SidebarGroupLabel>Booking Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={copyPortalLink} data-testid="button-sidebar-copy-portal">
                    {portalCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{portalCopied ? "Link Copied!" : "Copy Portal Link"}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer" data-testid="link-open-portal">
                      <Link2 className="h-4 w-4" />
                      <span>Open Portal</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || ""} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email || ""}
            </span>
          </div>
          <SidebarMenuButton
            onClick={() => logout()}
            className="h-8 w-8 p-0"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

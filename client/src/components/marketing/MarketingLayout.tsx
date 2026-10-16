import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

type MarketingLayoutProps = {
  children: ReactNode;
  showSectionLinks?: boolean;
  mainClassName?: string;
};

export function MarketingLayout({
  children,
  showSectionLinks = false,
  mainClassName = "pt-28",
}: MarketingLayoutProps) {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return (
    <div className="marketing-surface flex min-h-screen flex-col overflow-x-hidden bg-white text-gray-900 [color-scheme:light]">
      <MarketingHeader showSectionLinks={showSectionLinks} />
      <main className={`flex-1 ${mainClassName}`}>{children}</main>
      <MarketingFooter />
    </div>
  );
}

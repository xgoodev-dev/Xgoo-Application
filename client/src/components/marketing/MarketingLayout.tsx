import type { ReactNode } from "react";
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
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden flex flex-col">
      <MarketingHeader showSectionLinks={showSectionLinks} />
      <main className={`flex-1 ${mainClassName}`}>{children}</main>
      <MarketingFooter />
    </div>
  );
}

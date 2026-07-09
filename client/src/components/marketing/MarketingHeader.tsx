import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { LaunchingSoonRunner } from "./LaunchingSoonRunner";

type MarketingHeaderProps = {
  showSectionLinks?: boolean;
};

export function MarketingHeader({ showSectionLinks = false }: MarketingHeaderProps) {
  const [location, navigate] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <LaunchingSoonRunner />
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-bold text-gray-900 tracking-tight">XGoo</span>
          </button>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            {showSectionLinks && (
              <>
                <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
                  How It Works
                </a>
                <a href="#features" className="hover:text-gray-900 transition-colors">
                  Features
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => navigate("/about")}
              className={`hover:text-gray-900 transition-colors ${isActive("/about") ? "text-gray-900" : ""}`}
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className={`hover:text-gray-900 transition-colors ${isActive("/contact") ? "text-gray-900" : ""}`}
            >
              Contact
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate("/book")}
              className="bg-[#FF4907] hover:bg-[#e03d00] text-white gap-1 border-0"
            >
              Book a Parcel <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}

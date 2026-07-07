import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import xgooLogo from "@assets/XGoo-Logo-Build_20251130_080529_0001_1770959369961.png";
import { XgooGradientPanelPatterns } from "@/components/auth/XgooAuthPattern";

type AuthMode = "login" | "register";

const PARTNERS = ["DTDC", "FedEx", "Blue Dart", "Delhivery", "Ecom Express"];

function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  showToggle,
  visible,
  onToggleVisible,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  showToggle?: boolean;
  visible?: boolean;
  onToggleVisible?: () => void;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400 z-10" />
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        autoComplete={autoComplete}
        required
        className={cn(
          "h-[52px] rounded-none border-0 bg-[#f5f3f2] pl-11 pr-11 text-stone-900 shadow-none",
          "placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-[#FF4907]/40 focus-visible:bg-[#faf8f7]",
        )}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 z-10"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      )}
    </div>
  );
}

function VisualPanel() {
  return (
    <div className="hidden lg:flex w-[55%] xl:w-[58%] items-stretch p-6 xl:p-8 bg-white">
      <div
        className={cn(
          "relative flex flex-1 flex-col justify-end overflow-hidden",
          "bg-gradient-to-br from-[#e8325a] via-[#ff4907] to-[#ffb347]",
        )}
      >
        <XgooGradientPanelPatterns />

        <div className="relative z-10 p-10 xl:p-14 pb-12">
          <h2 className="text-3xl xl:text-[2.75rem] font-bold text-white leading-tight tracking-tight">
            One platform
            <br />
            for all shipments
          </h2>
          <p className="mt-4 max-w-md text-base text-white/85 leading-relaxed">
            Single dashboard for booking, tracking, billing, and courier partner management.
          </p>

          <div className="mt-10 pt-8 border-t border-white/20">
            <p className="text-sm font-medium text-white/70 mb-4">Integrated courier partners</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {PARTNERS.map((name) => (
                <span key={name} className="text-sm font-semibold text-white/95 tracking-wide">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({ title: "Error signing up", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "Confirmation link has been sent." });
    }
    setLoading(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Error signing in", description: error.message, variant: "destructive" });
    } else {
      setLocation("/dashboard");
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      toast({
        title: "Enter your email",
        description: "Type your email address above, then click Forgot password.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth-page`,
    });
    if (error) {
      toast({ title: "Could not send reset link", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "Password reset link has been sent." });
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({ title: "Google sign-in failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="flex min-h-screen bg-white text-stone-900 [color-scheme:light]" data-auth-page>
      {/* Left — Jeton-style form (~45%) */}
      <div className="flex w-full lg:w-[45%] xl:w-[42%] flex-col min-h-screen">
        <header className="flex items-center justify-between px-8 py-7 sm:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={xgooLogo} alt="XGoo" className="h-9 w-9 object-contain" />
            <span className="text-2xl font-bold tracking-tight text-[#FF4907]">XGoo</span>
          </Link>
          <Link
            href="/book"
            className="text-sm text-stone-500 hover:text-[#FF4907] transition-colors"
          >
            Book a parcel
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-[400px]">
            <h1 className="text-[2rem] sm:text-[2.125rem] font-bold tracking-tight text-stone-900 mb-8">
              {isLogin ? "Sign In" : "Sign Up"}
            </h1>

            <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
              <AuthField
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                icon={Mail}
                autoComplete="email"
              />
              <AuthField
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                icon={Lock}
                showToggle
                visible={showPassword}
                onToggleVisible={() => setShowPassword((v) => !v)}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />

              {isLogin && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-[#FF4907] hover:underline"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-stone-600 pt-4 pb-1">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(isLogin ? "register" : "login")}
                  className="font-semibold text-[#FF4907] hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>

              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "h-[52px] w-full rounded-none text-base font-semibold",
                  "bg-[#FF4907] hover:bg-[#e03d00] text-white shadow-none",
                )}
              >
                {loading ? (isLogin ? "Signing in…" : "Creating account…") : isLogin ? "Log In" : "Create Account"}
              </Button>
            </form>

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-stone-400">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="h-[52px] w-full rounded-none border border-stone-200 bg-[#f5f3f2] text-stone-800 hover:bg-stone-100 gap-3"
            >
              <FcGoogle className="h-5 w-5" />
              Google
            </Button>
          </div>
        </main>

        <footer className="px-8 py-8 sm:px-12">
          <p className="text-xs text-stone-400 leading-relaxed max-w-md">
            <span className="hover:text-stone-600 cursor-pointer">Privacy Policy</span>
            {" · "}
            <span className="hover:text-stone-600 cursor-pointer">Terms & Conditions</span>
            {" · "}
            <Link href="/book" className="hover:text-stone-600">
              Support
            </Link>
          </p>
          <p className="mt-2 text-xs text-stone-400">
            © {new Date().getFullYear()} XGoo Courier Services
          </p>
        </footer>
      </div>

      {/* Right — gradient visual panel with XGoo patterns */}
      <VisualPanel />
    </div>
  );
}

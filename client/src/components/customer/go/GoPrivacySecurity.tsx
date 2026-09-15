import { useState } from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { XGOO_MODULES } from "@/components/marketing/site-info";
import { useToast } from "@/hooks/use-toast";

export function GoPrivacySecurity({
  token,
  onBack,
  module = "go",
}: {
  token: string;
  onBack: () => void;
  module?: "go" | "pro";
}) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword() {
    if (newPassword.length < 8) {
      toast({
        title: "Check your password",
        description: "New password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customer/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-customer-token": token },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Could not change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password changed",
        description: `Your ${module === "pro" ? XGOO_MODULES.pro.name : XGOO_MODULES.go.name} account password has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Could not change password",
        description: error instanceof Error ? error.message : "Try signing in again, then update your password.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <button type="button" onClick={onBack} className="mb-4 text-sm font-medium text-zinc-500">
        ← Back
      </button>
      <h2 className="text-xl font-bold text-zinc-900">Privacy and security</h2>
      <Card className="mt-4 flex gap-3 border-zinc-100 p-4 shadow-none">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4907]/10 text-[#FF4907]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-zinc-900">Your account is protected</p>
          <p className="mt-1 text-sm text-zinc-500">
            {module === "pro"
              ? `${XGOO_MODULES.pro.name} sign-in uses Google, email, or phone. The same credentials work on the website.`
              : `${XGOO_MODULES.go.name} sign-in uses a one-time code on your mobile. The same phone number and OTP work on the website and the mobile app.`}
          </p>
        </div>
      </Card>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Change password</p>
      <Card className="mt-2 space-y-3 border-zinc-100 p-4 shadow-none">
        <Input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="New password (min 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button
          className="w-full rounded-none bg-[#FF4907] hover:bg-[#e03d00]"
          disabled={saving}
          onClick={() => void changePassword()}
        >
          {saving ? "Saving…" : "Update password"}
        </Button>
      </Card>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Policies</p>
      <div className="mt-2 flex flex-col gap-2 text-sm">
        <Link href="/privacy" className="text-[#FF4907] hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-[#FF4907] hover:underline">
          Terms and Conditions
        </Link>
        <Link href="/shipping-policy" className="text-[#FF4907] hover:underline">
          Shipping Policy
        </Link>
        <Link href="/cancellation-policy" className="text-[#FF4907] hover:underline">
          Cancellation Policy
        </Link>
      </div>
    </div>
  );
}

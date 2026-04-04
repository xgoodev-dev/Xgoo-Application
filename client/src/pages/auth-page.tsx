import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function AuthPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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

    async function handleGoogleSignIn() {
        setLoading(true);
        try {
            const redirectTo = `${window.location.origin}/dashboard`;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo,
                },
            });
            if (error) {
                toast({
                    title: "Google sign-in failed",
                    description: error.message,
                    variant: "destructive",
                });
            }
            // On success, auth-js redirects the browser to Google; no further code runs reliably.
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            toast({
                title: "Google sign-in failed",
                description: message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    const inputLight =
        "border-stone-200 bg-white text-stone-900 shadow-sm placeholder:text-stone-400 ring-offset-white focus-visible:ring-[#FF4907]";

    return (
        <div
            className={cn(
                "flex min-h-screen items-center justify-center px-4 py-10",
                "bg-gradient-to-b from-orange-50/80 via-white to-stone-100",
                "text-stone-900 [color-scheme:light]",
            )}
            data-auth-page
        >
            <Card
                className={cn(
                    "w-full max-w-md border-stone-200/90 bg-white text-stone-900",
                    "shadow-xl shadow-stone-300/30",
                )}
            >
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-stone-900">
                        XGoo Courier SaaS
                    </CardTitle>
                    <CardDescription className="text-stone-500">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login">
                        <TabsList
                            className={cn(
                                "grid h-11 w-full grid-cols-2 rounded-lg bg-stone-100/90 p-1 text-stone-600",
                            )}
                        >
                            <TabsTrigger
                                value="login"
                                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
                            >
                                Login
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
                            >
                                Register
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                            <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-stone-700">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={inputLight}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-stone-700">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={inputLight}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Signing in..." : "Sign In"}
                                </Button>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="bg-stone-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                                        <span className="bg-white px-2 text-stone-500">Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full gap-2 border-stone-200 bg-white text-stone-800 shadow-sm hover:bg-stone-50"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                >
                                    <FcGoogle className="h-5 w-5" />
                                    Google
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="register">
                            <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email" className="text-stone-700">
                                        Email
                                    </Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={inputLight}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password" className="text-stone-700">
                                        Password
                                    </Label>
                                    <Input
                                        id="reg-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={inputLight}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Creating account..." : "Register"}
                                </Button>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="bg-stone-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                                        <span className="bg-white px-2 text-stone-500">Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full gap-2 border-stone-200 bg-white text-stone-800 shadow-sm hover:bg-stone-50"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                >
                                    <FcGoogle className="h-5 w-5" />
                                    Google
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

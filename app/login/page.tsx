"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Server, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn("discord", { redirectTo: "/" });
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-background text-foreground relative overflow-hidden px-4">
      {/* Decorative radial gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-card/60 border-border backdrop-blur-md shadow-2xl relative z-10 hover:border-foreground/20 transition-all duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
            MineControl
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm mt-1.5 font-normal">
            Manage your Minecraft server.
          </CardDescription>
        </CardHeader>

        <CardContent className="py-6 px-8 flex flex-col gap-4">
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-all duration-200 gap-2.5 rounded-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            Login With Discord
          </Button>
        </CardContent>

        <CardFooter className="border-t border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground rounded-b-xl flex items-center justify-center">
          Secure OAuth access controlled by config permissions.
        </CardFooter>
      </Card>
    </div>
  );
}

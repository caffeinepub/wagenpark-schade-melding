import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, Shield, Truck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useRedeemInviteCode,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import { getUrlParameter } from "../utils/urlParams";

export function LoginPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const {
    data: profile,
    isFetched,
    isLoading: profileLoading,
  } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const redeemInviteCode = useRedeemInviteCode();
  const [wagennummer, setWagennummer] = useState("");
  const [step, setStep] = useState<"login" | "setup">("login");
  const [inviteCode] = useState<string | null>(() => getUrlParameter("invite"));
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  const isLoggingIn = loginStatus === "logging-in";
  const isAuthenticated = !!identity;

  useEffect(() => {
    if (!isAuthenticated || !isFetched || hasProcessed.current) return;
    hasProcessed.current = true;

    const redeem = inviteCode
      ? redeemInviteCode.mutateAsync(inviteCode).catch(() => {
          toast.error("Uitnodigingslink is ongeldig of al gebruikt.");
        })
      : Promise.resolve();

    redeem.then(() => {
      if (profile !== null) {
        navigate({ to: "/" });
      } else {
        setStep("setup");
      }
    });
  }, [
    isAuthenticated,
    isFetched,
    inviteCode,
    redeemInviteCode,
    profile,
    navigate,
  ]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetup = async () => {
    if (!wagennummer.trim()) return;
    await saveProfile.mutateAsync({ name: wagennummer.trim() });
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sidebar flex items-center justify-center mb-4 shadow-card">
            <Truck size={28} className="text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">WagenPark</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schadebeheer systeem
          </p>
        </div>

        {inviteCode && step === "login" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Alert className="border-primary/30 bg-primary/5">
              <Mail size={16} className="text-primary" />
              <AlertDescription className="text-sm">
                <span className="font-semibold">Je bent uitgenodigd!</span> Log
                in om toegang te krijgen tot WagenPark.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {step === "login" ? "Inloggen" : "Wagennummer instellen"}
            </CardTitle>
            <CardDescription>
              {step === "login"
                ? "Log in om schademeldingen te bekijken en te maken"
                : "Voer uw wagennummer in om door te gaan"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "login" ? (
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={handleLogin}
                  disabled={isLoggingIn || profileLoading}
                  data-ocid="login.primary_button"
                >
                  {isLoggingIn || profileLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  {isLoggingIn
                    ? "Inloggen..."
                    : profileLoading
                      ? "Laden..."
                      : "Inloggen"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wagennummer">Wagennummer</Label>
                  <Input
                    id="wagennummer"
                    placeholder="bv. T-001 of A-042"
                    value={wagennummer}
                    onChange={(e) => setWagennummer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetup()}
                    autoFocus
                    data-ocid="login.wagennummer.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dit is het nummer van uw voertuig (trekker of aanhanger)
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleSetup}
                  disabled={!wagennummer.trim() || saveProfile.isPending}
                  data-ocid="login.setup.submit_button"
                >
                  {saveProfile.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Doorgaan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}

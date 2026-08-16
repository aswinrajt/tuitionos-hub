import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, GraduationCap, HeartHandshake, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParentAuth } from "@/store/parent-auth";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { ParentMeData } from "@/hooks/api";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/login")({
  head: () => ({
    meta: [
      { title: "Parent login — TuitionOS" },
      {
        name: "description",
        content: "Parents sign in with their mobile number or email to follow their child's attendance, fees, homework and results.",
      },
      { property: "og:title", content: "Parent login — TuitionOS" },
      { property: "og:description", content: "One simple login to follow your child's progress." },
    ],
  }),
  component: ParentLoginPage,
});

const DEMO_PHONE = "+91 98765 43210";
const DEMO_OTP = "1234";

type AuthPayload = {
  parent: { id: string; name: string; phone: string; email: string };
  accessToken: string;
};

function ParentLoginPage() {
  const { parent, login, setActiveChildId } = useParentAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (parent) navigate({ to: "/parent", replace: true });
  }, [parent, navigate]);

  const apiMessage = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback;

  const completeLogin = async (data: AuthPayload) => {
    login(
      { parentId: data.parent.id, name: data.parent.name, contact: data.parent.phone },
      data.accessToken,
    );
    const me = await api<ParentMeData>("/v1/parent/auth/me");
    qc.setQueryData(qk.parentMe, me.data);
    if (me.data.children[0]?.id) setActiveChildId(me.data.children[0].id);
    toast.success(`Welcome, ${data.parent.name}`);
    navigate({ to: "/parent", replace: true });
  };

  const sendOtp = async () => {
    setError("");
    if (!contact.trim()) {
      setError("Please enter your mobile number or email.");
      return;
    }
    setBusy(true);
    try {
      await api("/v1/parent/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ contact: contact.trim() }),
      });
      setOtpSent(true);
      toast.success("OTP sent.");
    } catch (err) {
      setError(apiMessage(err, "Could not send OTP."));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (otp.trim().length < 4) {
      setError("Enter the 4-digit OTP.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api<AuthPayload>("/v1/parent/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ contact: contact.trim(), otp: otp.trim() }),
      });
      await completeLogin(data);
    } catch (err) {
      setError(apiMessage(err, "Could not verify OTP."));
    } finally {
      setBusy(false);
    }
  };

  const signInWithPassword = async () => {
    setError("");
    if (!contact.trim() || password.length < 4) {
      setError("Enter your mobile/email and a password of at least 4 characters.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api<AuthPayload>("/v1/parent/auth/login", {
        method: "POST",
        body: JSON.stringify({ contact: contact.trim(), password }),
      });
      await completeLogin(data);
    } catch (err) {
      setError(apiMessage(err, "Could not sign in."));
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async () => {
    setContact(DEMO_PHONE);
    setError("");
    setBusy(true);
    try {
      const { data } = await api<AuthPayload>("/v1/parent/auth/demo", { method: "POST" });
      await completeLogin(data);
    } catch (err) {
      setError(apiMessage(err, "Could not start the demo."));
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    setError("");
    if (!contact.trim()) {
      setError("Please enter your mobile number or email.");
      return;
    }
    setBusy(true);
    try {
      await api("/v1/parent/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ contact: contact.trim() }),
      });
      toast.success("Reset instructions sent to your registered mobile.");
      setForgotOpen(false);
    } catch (err) {
      setError(apiMessage(err, "Could not send reset instructions."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-float">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-foreground/15">
            <GraduationCap className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold">Parent Portal</h1>
          <p className="mt-2 text-sm text-primary-foreground/85">
            Follow your child's attendance, fees, homework and results in one simple place.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-primary-foreground/85">
            <li className="flex items-center gap-2"><HeartHandshake className="size-4" /> Made for parents — no jargon</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4" /> Only your child's information</li>
          </ul>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-background p-5 shadow-sm">
          {forgotOpen ? (
            <div className="space-y-4">
              <button
                className="flex items-center gap-1.5 text-sm font-medium text-primary"
                onClick={() => {
                  setForgotOpen(false);
                  setError("");
                }}
              >
                <ArrowLeft className="size-4" /> Back to login
              </button>
              <div>
                <h2 className="font-display text-lg font-semibold">Forgot password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your registered mobile number. We will send a reset link and an OTP you can
                  use to sign in.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="forgot">Mobile number or email</Label>
                <Input
                  id="forgot"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  inputMode="tel"
                />
              </div>
              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
              <Button className="h-12 w-full text-base" loading={busy} onClick={() => void sendReset()}>
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the mobile number you gave the tuition centre.
              </p>

              <Tabs value={mode} onValueChange={(v) => { setMode(v as "otp" | "password"); setError(""); }} className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="otp">OTP</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                </TabsList>

                <TabsContent value="otp" className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact">Mobile number or email</Label>
                    <Input
                      id="contact"
                      className="h-12 text-base"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      inputMode="tel"
                    />
                  </div>
                  {otpSent ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="otp">Enter 4-digit OTP</Label>
                      <Input
                        id="otp"
                        className="h-12 text-center text-2xl tracking-[0.5em]"
                        value={otp}
                        maxLength={4}
                        inputMode="numeric"
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                      />
                      <button className="text-xs font-medium text-primary" onClick={() => void sendOtp()}>
                        Resend OTP
                      </button>
                    </div>
                  ) : null}
                  {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
                  <Button
                    className="h-12 w-full text-base"
                    loading={busy}
                    onClick={() => void (otpSent ? verifyOtp() : sendOtp())}
                  >
                    <Smartphone className="mr-2 size-4" />
                    {busy ? (otpSent ? "Verifying…" : "Sending OTP…") : otpSent ? "Verify & sign in" : "Send OTP"}
                  </Button>
                </TabsContent>

                <TabsContent value="password" className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact2">Mobile number or email</Label>
                    <Input
                      id="contact2"
                      className="h-12 text-base"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="aswin.raj@gmail.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pass">Password</Label>
                    <Input
                      id="pass"
                      type="password"
                      className="h-12 text-base"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
                  <Button className="h-12 w-full text-base" loading={busy} onClick={() => void signInWithPassword()}>
                    <KeyRound className="mr-2 size-4" />
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button className="font-medium text-primary" onClick={() => { setForgotOpen(true); setError(""); }}>
                  Forgot password?
                </button>
                <button className="font-medium text-muted-foreground" disabled={busy} onClick={() => void demoLogin()}>
                  Use demo parent
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-background p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Demo login</p>
          <p className="mt-1">Mobile {DEMO_PHONE} · OTP {DEMO_OTP}</p>
        </div>

        <p className="mt-auto pt-6 text-center text-xs text-muted-foreground">
          Are you a teacher or centre owner?{" "}
          <Link to="/login" className="font-medium text-primary">
            Staff login
          </Link>
        </p>
      </div>
    </div>
  );
}

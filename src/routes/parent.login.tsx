import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, GraduationCap, HeartHandshake, KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParentAuth } from "@/store/parent-auth";
import { useStore } from "@/store/tuition-store";
import { DEMO_PARENT_OTP } from "@/data/mock";
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

function ParentLoginPage() {
  const { parent, login, setActiveChildId } = useParentAuth();
  const store = useStore();
  const navigate = useNavigate();
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

  const findAccount = (value: string) => {
    const needle = value.replace(/\s|-/g, "").toLowerCase();
    return store.parentAccounts.find(
      (p) =>
        p.phone.replace(/\s|-/g, "").toLowerCase().endsWith(needle.slice(-10)) ||
        p.email.toLowerCase() === needle,
    );
  };

  const signIn = (value: string) => {
    const account = findAccount(value);
    if (!account) {
      setError("We could not find this number or email. Please check with the centre.");
      return;
    }
    login({ parentId: account.id, name: account.name, contact: account.phone });
    if (account.studentIds[0]) setActiveChildId(account.studentIds[0]);
    toast.success(`Welcome, ${account.name}`);
    navigate({ to: "/parent", replace: true });
  };

  const sendOtp = () => {
    setError("");
    if (!contact.trim()) {
      setError("Please enter your mobile number or email.");
      return;
    }
    if (!findAccount(contact)) {
      setError("This number is not registered. Please contact the tuition centre.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setOtpSent(true);
      toast.success(`OTP sent. Use ${DEMO_PARENT_OTP} for this demo.`);
    }, 700);
  };

  const verifyOtp = () => {
    setError("");
    if (otp.trim() !== DEMO_PARENT_OTP) {
      setError("That OTP is not correct. Please try again.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      signIn(contact);
    }, 500);
  };

  const signInWithPassword = () => {
    setError("");
    if (!contact.trim() || password.length < 4) {
      setError("Enter your mobile/email and a password of at least 4 characters.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      signIn(contact);
    }, 600);
  };

  const demoLogin = () => {
    setContact(DEMO_PHONE);
    signIn(DEMO_PHONE);
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-float">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary-foreground/15">
            <GraduationCap className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold">
            {store.settings.centreName} — Parent Portal
          </h1>
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
              <Button
                className="h-12 w-full text-base"
                onClick={() => {
                  if (!findAccount(contact)) {
                    setError("This number is not registered with the centre.");
                    return;
                  }
                  setError("");
                  toast.success("Reset instructions sent to your registered mobile.");
                  setForgotOpen(false);
                }}
              >
                Send reset link
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
                      <button className="text-xs font-medium text-primary" onClick={sendOtp}>
                        Resend OTP
                      </button>
                    </div>
                  ) : null}
                  {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
                  <Button
                    className="h-12 w-full text-base"
                    disabled={busy}
                    onClick={otpSent ? verifyOtp : sendOtp}
                  >
                    {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Smartphone className="mr-2 size-4" />}
                    {otpSent ? "Verify & sign in" : "Send OTP"}
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
                  <Button className="h-12 w-full text-base" disabled={busy} onClick={signInWithPassword}>
                    {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
                    Sign in
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button className="font-medium text-primary" onClick={() => { setForgotOpen(true); setError(""); }}>
                  Forgot password?
                </button>
                <button className="font-medium text-muted-foreground" onClick={demoLogin}>
                  Use demo parent
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-background p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Demo login</p>
          <p className="mt-1">Mobile {DEMO_PHONE} · OTP {DEMO_PARENT_OTP}</p>
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

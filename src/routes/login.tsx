import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/common/FormModal";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/store/auth";
import { api, ApiError, toastError } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — TuitionOS" },
      {
        name: "description",
        content:
          "Sign in to TuitionOS or register your tuition centre to manage students, batches, fees and attendance.",
      },
      { property: "og:title", content: "Sign in — TuitionOS" },
      {
        property: "og:description",
        content: "Sign in to TuitionOS or register your tuition centre in under a minute.",
      },
    ],
  }),
  component: LoginPage,
});

const highlights = [
  { icon: GraduationCap, title: "Batches & attendance", text: "Mark a full batch present in two taps." },
  { icon: Wallet, title: "Fees without spreadsheets", text: "Track collected, pending and overdue fees monthly." },
  { icon: ShieldCheck, title: "Parents stay informed", text: "Share results, homework and fee reminders." },
];

function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [email, setEmail] = useState("anil@vidyaclasses.in");
  const [password, setPassword] = useState("demo1234");
  const [centre, setCentre] = useState("");
  const [owner, setOwner] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("demo1234");
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (ready && user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  const finish = async (
    action: string,
    path: string,
    body?: Record<string, unknown>,
  ) => {
    setLoading(action);
    try {
      const { data } = await api<{
        user: { id: string; name: string; email: string; centreName: string; role: "owner" | "teacher" };
        accessToken: string;
      }>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      login(data.user, data.accessToken);
      toast.success(`Welcome to TuitionOS, ${data.user.name.split(" ")[0]}!`);
      navigate({ to: "/" });
    } catch (err) {
      toastError(err, err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="gradient-hero relative hidden flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-2.5 text-primary-foreground">
          <span className="grid size-10 place-items-center rounded-xl bg-accent font-display text-lg font-bold text-accent-foreground">
            T
          </span>
          <span className="font-display text-xl font-semibold">TuitionOS</span>
        </div>
        <div className="max-w-md text-primary-foreground">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Run your tuition centre, not spreadsheets.
          </h1>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Students, batches, attendance, fees, homework and results — organised in one calm
            dashboard built for Indian tuition centres.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-foreground/15">
                  <h.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{h.title}</span>
                  <span className="block text-xs text-primary-foreground/75">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Trusted by 400+ coaching centres across India
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
              T
            </span>
            <span className="font-display text-xl font-semibold">TuitionOS</span>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="forgot">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Sign in to your centre dashboard.</p>
              </div>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void finish("login", "/v1/auth/login", { email, password });
                }}
              >
                <Field label="Email">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </Field>
                <Field label="Password">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox defaultChecked /> Keep me signed in
                </label>
                <Button type="submit" className="w-full" loading={loading === "login"}>
                  {loading === "login" ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                variant="outline"
                className="w-full"
                loading={loading === "demo"}
                onClick={() => void finish("demo", "/v1/auth/demo")}
              >
                {loading === "demo" ? (
                  "Opening demo…"
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4 text-accent" />
                    Explore the demo centre
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="mt-6 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Register your centre</h2>
                <p className="text-sm text-muted-foreground">
                  Set up TuitionOS in under a minute. No card required.
                </p>
              </div>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void finish("register", "/v1/auth/register", {
                    centreName: centre,
                    ownerName: owner,
                    email: regEmail,
                    password: regPassword,
                  });
                }}
              >
                <Field label="Tuition centre name">
                  <Input
                    value={centre}
                    onChange={(e) => setCentre(e.target.value)}
                    placeholder="Vidya Classes"
                    required
                  />
                </Field>
                <Field label="Owner name">
                  <Input
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Anil Kumar"
                    required
                  />
                </Field>
                <Field label="Email">
                  <Input
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    type="email"
                    placeholder="you@centre.in"
                    required
                  />
                </Field>
                <Field label="Password" hint="Minimum 8 characters">
                  <Input
                    type="password"
                    minLength={8}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </Field>
                <Button type="submit" className="w-full" loading={loading === "register"}>
                  {loading === "register" ? "Creating account…" : "Create centre account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="forgot" className="mt-6 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold">Reset password</h2>
                <p className="text-sm text-muted-foreground">
                  We'll email you a secure reset link.
                </p>
              </div>
              {forgotSent ? (
                <div className="surface-card space-y-2 p-5 text-sm">
                  <p className="font-semibold text-success">Reset link sent</p>
                  <p className="text-muted-foreground">
                    Check {resetEmail || "your inbox"} for instructions. The link expires in 30
                    minutes.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setForgotSent(false)}>
                    Send again
                  </Button>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void (async () => {
                      setLoading("forgot");
                      try {
                        await api("/v1/auth/forgot-password", {
                          method: "POST",
                          body: JSON.stringify({ email: resetEmail }),
                        });
                        setForgotSent(true);
                        toast.success("Password reset link sent");
                      } catch (err) {
                        toastError(err);
                      } finally {
                        setLoading(null);
                      }
                    })();
                  }}
                >
                  <Field label="Registered email">
                    <Input
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      type="email"
                      placeholder="you@centre.in"
                      required
                    />
                  </Field>
                  <Button type="submit" className="w-full" loading={loading === "forgot"}>
                    {loading === "forgot" ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Are you a parent?{" "}
            <Link to="/parent/login" className="font-medium text-primary">
              Go to the Parent Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

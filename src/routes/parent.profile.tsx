import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, LogOut, Mail, Phone, Save, Users } from "lucide-react";
import { ParentCard, ParentEmpty, ParentPageTitle, ParentShell, useParentContext } from "@/components/parent/ParentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useParentAuth } from "@/store/parent-auth";
import { initials } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/profile")({
  head: () => ({
    meta: [
      { title: "My profile — TuitionOS Parent Portal" },
      { name: "description", content: "Update your contact details, choose which alerts you receive and manage your linked children." },
      { property: "og:title", content: "My profile — TuitionOS Parent Portal" },
      { property: "og:description", content: "Contact details, alert preferences and linked children." },
    ],
  }),
  component: ParentProfilePage,
});

function ParentProfilePage() {
  const { account, children, child, setActiveChildId, store } = useParentContext();
  const { logout } = useParentAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(account?.name ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [email, setEmail] = useState(account?.email ?? "");

  if (!account) {
    return (
      <ParentShell>
        <ParentEmpty title="Profile unavailable" body="Please sign in again." />
      </ParentShell>
    );
  }

  const toggles = [
    { key: "notifyFees", label: "Fee reminders", hint: "Due date and payment confirmations" },
    { key: "notifyAttendance", label: "Absence alerts", hint: "When your child is marked absent" },
    { key: "notifyHomework", label: "New homework", hint: "When teachers assign homework" },
    { key: "notifyResults", label: "Exam results", hint: "When marks are published" },
    { key: "notifyAnnouncements", label: "Centre notices", hint: "Holidays and general updates" },
  ] as const;

  return (
    <ParentShell>
      <ParentPageTitle title="My profile" description="Your details and alert preferences." />

      <ParentCard>
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            {initials(account.name)}
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{account.name}</p>
            <p className="truncate text-sm text-muted-foreground">{account.phone}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone"><Phone className="mr-1 inline size-3.5" /> Mobile number</Label>
            <Input id="phone" className="h-11" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email"><Mail className="mr-1 inline size-3.5" /> Email</Label>
            <Input id="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button
            className="h-11 w-full"
            onClick={() => {
              store.updateParentAccount(account.id, { name, phone, email });
              toast.success("Your details have been saved");
            }}
          >
            <Save className="mr-2 size-4" /> Save changes
          </Button>
        </div>
      </ParentCard>

      <ParentCard title={`My children (${children.length})`}>
        <ul className="space-y-2">
          {children.map((c) => {
            const batch = store.batches.find((b) => b.id === c.batchId);
            const active = c.id === child?.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setActiveChildId(c.id);
                    toast.success(`Showing ${c.name}`);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    active ? "border-primary bg-primary-soft/50" : "border-border"
                  }`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
                    {initials(c.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.className} · {batch?.name ?? "No batch"}
                    </span>
                  </span>
                  {active ? <Badge className="shrink-0">Viewing</Badge> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Users className="mt-0.5 size-3.5 shrink-0" />
          To add another child, ask the tuition centre to link them to this mobile number.
        </p>
      </ParentCard>

      <ParentCard title="Alerts I want to receive">
        <ul className="space-y-3">
          {toggles.map((t) => (
            <li key={t.key} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </div>
              <Switch
                checked={account[t.key]}
                onCheckedChange={(checked) => {
                  store.updateParentAccount(account.id, { [t.key]: checked });
                  toast.success(`${t.label} ${checked ? "on" : "off"}`);
                }}
              />
            </li>
          ))}
        </ul>
      </ParentCard>

      <ParentCard title="Help & centre contact">
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <HelpCircle className="size-4" /> Call the office for anything you cannot find here.
          </p>
          <p className="font-medium">{store.settings.centreName}</p>
          <p className="text-muted-foreground">{store.settings.address}, {store.settings.city}</p>
          <a href={`tel:${store.settings.ownerPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 font-medium text-primary">
            <Phone className="size-4" /> {store.settings.ownerPhone}
          </a>
        </div>
      </ParentCard>

      <Button
        variant="outline"
        className="h-12 w-full text-destructive"
        onClick={() => {
          logout();
          toast.success("Signed out");
          navigate({ to: "/parent/login", replace: true });
        }}
      >
        <LogOut className="mr-2 size-4" /> Sign out
      </Button>
      <div className="pb-2" />
    </ParentShell>
  );
}

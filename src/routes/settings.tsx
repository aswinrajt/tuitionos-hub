import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Building2, IndianRupee, ListChecks, LogOut, Plus, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Field } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/tuition-store";
import { useAuth } from "@/store/auth";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import type { CentreSettings } from "@/data/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TuitionOS" },
      {
        name: "description",
        content: "Configure your tuition centre profile, fee rules, classes, subjects and notifications.",
      },
      { property: "og:title", content: "Settings — TuitionOS" },
      { property: "og:description", content: "Centre profile, fee rules and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const store = useStore();
  const { user, logout } = useAuth();
  const [draft, setDraft] = useState<CentreSettings>(store.settings);
  const [newClass, setNewClass] = useState("");
  const [newSubject, setNewSubject] = useState("");

  const set = <K extends keyof CentreSettings>(key: K, value: CentreSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    store.updateSettings(draft);
    toast.success("Settings saved");
  };

  const toggles: { key: keyof CentreSettings; label: string; hint: string }[] = [
    { key: "notifyFeeDue", label: "Fee due reminders", hint: "WhatsApp reminder to parents before the due date." },
    { key: "notifyAbsent", label: "Absent alerts", hint: "Notify parents the same day a student is marked absent." },
    { key: "notifyExamResults", label: "Result updates", hint: "Send result cards to parents when marks are saved." },
    { key: "notifyHomework", label: "Homework alerts", hint: "Share new assignments with the batch instantly." },
    { key: "weeklyReport", label: "Weekly owner report", hint: "Email summary of collections and attendance every Monday." },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Centre profile, fee rules, academics and notifications."
        actions={<Button onClick={save}>Save changes</Button>}
      />

      <Tabs defaultValue="centre" className="space-y-5">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="centre">Centre</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="centre" className="space-y-5">
          <SectionCard title="Centre profile" description="Shown on receipts and reports.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Centre name" className="sm:col-span-2">
                <Input value={draft.centreName} onChange={(e) => set("centreName", e.target.value)} />
              </Field>
              <Field label="Owner name">
                <Input value={draft.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
              </Field>
              <Field label="Owner email">
                <Input type="email" value={draft.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={draft.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={draft.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="GSTIN" hint="Optional — printed on receipts if provided.">
                <Input value={draft.gstin} onChange={(e) => set("gstin", e.target.value)} />
              </Field>
              <Field label="Academic year">
                <Input value={draft.academicYear} onChange={(e) => set("academicYear", e.target.value)} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Textarea rows={3} value={draft.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Your account" description="Signed in on this device.">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{user?.name ?? draft.ownerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email ?? draft.ownerEmail} · {user?.role ?? "owner"}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 size-4" /> Sign out
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="fees" className="space-y-5">
          <SectionCard title="Fee rules" description="Applied while generating dues and reminders.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Monthly due day" hint={`Dues are raised on day ${draft.feeDueDay} of every month.`}>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={draft.feeDueDay}
                  onChange={(e) => set("feeDueDay", Number(e.target.value))}
                />
              </Field>
              <Field label="Late fee (₹)" hint={`Currently ${inr(draft.lateFeeAmount)} after the due date.`}>
                <Input
                  type="number"
                  value={draft.lateFeeAmount}
                  onChange={(e) => set("lateFeeAmount", Number(e.target.value))}
                />
              </Field>
              <Field label="Reminder days before due">
                <Input
                  type="number"
                  value={draft.reminderDaysBefore}
                  onChange={(e) => set("reminderDaysBefore", Number(e.target.value))}
                />
              </Field>
              <Field label="Currency">
                <Input value={draft.currency} onChange={(e) => set("currency", e.target.value)} />
              </Field>
            </div>
            <Separator className="my-5" />
            <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              <IndianRupee className="mt-0.5 size-4 shrink-0" />
              <p>
                Expected monthly collection at current enrolment:{" "}
                <span className="font-semibold text-foreground">
                  {inr(store.students.filter((s) => s.status === "active").reduce((sum, s) => sum + s.monthlyFee, 0))}
                </span>
              </p>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="academics" className="space-y-5">
          <SectionCard title="Classes" description="Grades your centre teaches.">
            <TagEditor
              items={draft.classes}
              value={newClass}
              onValueChange={setNewClass}
              placeholder="Class 11"
              onAdd={(v) => set("classes", [...draft.classes, v])}
              onRemove={(v) => set("classes", draft.classes.filter((c) => c !== v))}
            />
          </SectionCard>
          <SectionCard title="Subjects" description="Used across batches, homework and exams.">
            <TagEditor
              items={draft.subjects}
              value={newSubject}
              onValueChange={setNewSubject}
              placeholder="Computer Science"
              onAdd={(v) => set("subjects", [...draft.subjects, v])}
              onRemove={(v) => set("subjects", draft.subjects.filter((s) => s !== v))}
            />
          </SectionCard>
          <SectionCard title="Snapshot">
            <ul className="grid gap-2 text-sm sm:grid-cols-3">
              <li className="flex items-center gap-2 rounded-xl border border-border p-3">
                <ListChecks className="size-4 text-primary" /> {store.batches.length} batches
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-border p-3">
                <ListChecks className="size-4 text-primary" /> {store.students.length} students
              </li>
              <li className="flex items-center gap-2 rounded-xl border border-border p-3">
                <ListChecks className="size-4 text-primary" /> {store.teachers.length} teachers
              </li>
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-5">
          <SectionCard title="Notifications" description="Choose what parents and you receive.">
            <ul className="divide-y divide-border">
              {toggles.map((t) => (
                <li key={t.key} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Bell className="size-4 text-primary" /> {t.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.hint}</p>
                  </div>
                  <Switch
                    checked={Boolean(draft[t.key])}
                    onCheckedChange={(v) => set(t.key, v as CentreSettings[typeof t.key])}
                  />
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={save}>Save changes</Button>
      </div>
    </AppShell>
  );
}

function TagEditor({
  items,
  value,
  onValueChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  items: string[];
  value: string;
  onValueChange: (v: string) => void;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
}) {
  const add = () => {
    const v = value.trim();
    if (!v) return;
    if (items.includes(v)) {
      toast.error("Already added");
      return;
    }
    onAdd(v);
    onValueChange("");
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-1.5">
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              className="grid size-4 place-items-center rounded-full hover:bg-foreground/10"
              onClick={() => onRemove(item)}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

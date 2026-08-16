import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, IndianRupee, Mail, MoreVertical, Pencil, Phone, Plus, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormModal, Field } from "@/components/common/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/store/tuition-store";
import { formatDate, formatTime, initials, inr } from "@/lib/format";
import type { Teacher } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — TuitionOS" },
      {
        name: "description",
        content: "Manage tuition centre faculty: subjects taught, assigned batches, salary and contact details.",
      },
      { property: "og:title", content: "Teachers — TuitionOS" },
      { property: "og:description", content: "Faculty directory with batches, subjects and salaries." },
    ],
  }),
  component: TeachersPage,
});

const emptyDraft = (subject: string) => ({
  name: "",
  phone: "",
  email: "",
  subjects: [subject],
  qualification: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  status: "active" as Teacher["status"],
  monthlySalary: 25000,
});

function TeachersPage() {
  const store = useStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [toDelete, setToDelete] = useState<Teacher | null>(null);
  const [draft, setDraft] = useState(emptyDraft(store.settings.subjects[0] ?? "Mathematics"));

  const rows = store.teachers.filter((t) =>
    `${t.name} ${t.subjects.join(" ")} ${t.phone}`.toLowerCase().includes(query.toLowerCase()),
  );
  const payroll = store.teachers.reduce((s, t) => s + t.monthlySalary, 0);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft(store.settings.subjects[0] ?? "Mathematics"));
    setOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setDraft({ ...t });
    setOpen(true);
  };

  const toggleSubject = (subject: string) =>
    setDraft((d) => ({
      ...d,
      subjects: d.subjects.includes(subject)
        ? d.subjects.filter((s) => s !== subject)
        : [...d.subjects, subject],
    }));

  return (
    <AppShell>
      <PageHeader
        title="Teachers"
        description="Faculty directory with batches, subjects and salary details."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Add teacher
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total teachers" value={store.teachers.length} icon={GraduationCap} />
        <StatCard label="Active" value={store.teachers.filter((t) => t.status === "active").length} icon={Users} tone="success" />
        <StatCard label="On leave" value={store.teachers.filter((t) => t.status === "on-leave").length} icon={Users} tone="warning" />
        <StatCard label="Monthly payroll" value={inr(payroll)} icon={IndianRupee} tone="info" />
      </div>

      <SectionCard bodyClassName="p-4">
        <Input
          placeholder="Search teachers by name, subject or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </SectionCard>

      {rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((t) => {
            const batches = store.batches.filter((b) => b.teacherId === t.id);
            const studentCount = store.students.filter((s) =>
              batches.some((b) => b.id === s.batchId),
            ).length;
            return (
              <div key={t.id} className="surface-card flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft font-display text-base font-semibold text-primary">
                    {initials(t.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.qualification}</p>
                    <div className="mt-1.5"><StatusBadge status={t.status} /></div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Teacher actions">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(t)}>
                        <Pencil className="mr-2 size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          store.updateTeacher(t.id, {
                            status: t.status === "active" ? "on-leave" : "active",
                          });
                          toast.success(t.status === "active" ? "Marked on leave" : "Marked active");
                        }}
                      >
                        {t.status === "active" ? "Mark on leave" : "Mark active"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(t)}>
                        <Trash2 className="mr-2 size-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {t.subjects.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><Phone className="size-3.5" /> {t.phone}</p>
                  <p className="flex items-center gap-2 truncate"><Mail className="size-3.5" /> {t.email}</p>
                  <p className="flex items-center gap-2"><IndianRupee className="size-3.5" /> {inr(t.monthlySalary)} / month</p>
                  <p>Joined {formatDate(t.joiningDate)}</p>
                </div>

                <div className="mt-auto rounded-xl bg-muted/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {batches.length} batches · {studentCount} students
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {batches.length ? (
                      batches.map((b) => (
                        <li key={b.id} className="flex justify-between gap-2">
                          <span className="truncate">{b.name}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatTime(b.startTime)}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No batches assigned yet</li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <SectionCard bodyClassName="p-0">
          <EmptyState
            icon={GraduationCap}
            title="No teachers found"
            description="Try a different search, or add a new teacher to your centre."
            action={<Button size="sm" onClick={openCreate}>Add teacher</Button>}
          />
        </SectionCard>
      )}

      <FormModal
        open={open}
        onOpenChange={setOpen}
        wide
        title={editing ? "Edit teacher" : "Add teacher"}
        description="Faculty details, subjects and salary."
        submitLabel={editing ? "Save changes" : "Add teacher"}
        onSubmit={() => {
          if (!draft.name.trim() || !draft.phone.trim()) {
            toast.error("Name and phone are required");
            return;
          }
          if (editing) {
            store.updateTeacher(editing.id, draft);
            toast.success("Teacher updated");
          } else {
            store.addTeacher(draft);
            toast.success("Teacher added");
          }
          setOpen(false);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Anjali Deshmukh" />
          </Field>
          <Field label="Qualification">
            <Input value={draft.qualification} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} placeholder="M.Sc. Mathematics, B.Ed." />
          </Field>
          <Field label="Phone">
            <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Email">
            <Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="anjali@tuitionos.in" />
          </Field>
          <Field label="Joining date">
            <Input type="date" value={draft.joiningDate} onChange={(e) => setDraft({ ...draft, joiningDate: e.target.value })} />
          </Field>
          <Field label="Monthly salary (₹)">
            <Input type="number" value={draft.monthlySalary} onChange={(e) => setDraft({ ...draft, monthlySalary: Number(e.target.value) })} />
          </Field>
          <Field label="Status">
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Teacher["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-leave">On leave</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subjects taught" className="sm:col-span-2" hint="Tap to select one or more subjects.">
            <div className="flex flex-wrap gap-2">
              {store.settings.subjects.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={draft.subjects.includes(s) ? "default" : "outline"}
                  onClick={() => toggleSubject(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </Field>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remove this teacher?"
        description={`${toDelete?.name} will be removed from the faculty list.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (toDelete) {
            store.deleteTeacher(toDelete.id);
            toast.success("Teacher removed");
          }
          setToDelete(null);
        }}
      />
    </AppShell>
  );
}

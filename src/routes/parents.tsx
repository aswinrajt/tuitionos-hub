import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, ClipboardList, MessageSquare, Smartphone, UserRound, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/tuition-store";
import { attendancePct, examStats } from "@/lib/selectors";
import { formatDate, initials, inr, pct } from "@/lib/format";
import { TODAY } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/parents")({
  head: () => ({
    meta: [
      { title: "Parent portal preview — TuitionOS" },
      {
        name: "description",
        content: "Preview the parent view: attendance, fee status, homework and results for each student.",
      },
      { property: "og:title", content: "Parent portal preview — TuitionOS" },
      { property: "og:description", content: "See exactly what parents see before you share updates." },
    ],
  }),
  component: ParentsPage,
});

function ParentsPage() {
  const store = useStore();
  const [studentId, setStudentId] = useState(store.students[0]?.id ?? "");
  const student = store.students.find((s) => s.id === studentId) ?? store.students[0];

  if (!student) return <AppShell><PageHeader title="Parent portal" /></AppShell>;

  const batch = store.batches.find((b) => b.id === student.batchId);
  const teacher = store.teachers.find((t) => t.id === batch?.teacherId);
  const attendance = attendancePct(store.attendance, student.id);
  const month = TODAY.slice(0, 7);
  const paid = store.feePayments.some((p) => p.studentId === student.id && p.month === month);
  const homework = store.homework
    .filter((h) => h.batchId === student.batchId)
    .slice(0, 4);
  const results = store.exams
    .filter((e) => e.batchId === student.batchId)
    .map((e) => ({ exam: e, result: e.results.find((r) => r.studentId === student.id) }))
    .filter((x) => x.result?.marks != null)
    .slice(0, 4);

  return (
    <AppShell>
      <PageHeader
        title="Parent portal preview"
        description="This is the read-only view parents get on their phone. Coming soon as a separate login."
        actions={
          <Button variant="outline" onClick={() => toast.success("Portal invite sent to parent on WhatsApp")}>
            <MessageSquare className="mr-2 size-4" /> Send invite
          </Button>
        }
      />

      <SectionCard bodyClassName="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {store.students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} — {s.className}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Smartphone className="size-4" /> Previewing as {student.parentName}
          </p>
        </div>
      </SectionCard>

      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-[2rem] border-8 border-foreground/90 bg-background p-4 shadow-float">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-foreground/20" />
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initials(student.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">{student.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {student.className} · {batch?.name ?? "No batch"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarCheck className="size-3.5" /> Attendance
                </p>
                <p className="mt-1 font-display text-xl font-semibold">{pct(attendance)}</p>
                <Progress value={attendance} className="mt-2" />
              </div>
              <div className="rounded-2xl border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="size-3.5" /> Fees {formatDate(`${month}-01`).slice(3)}
                </p>
                <p className="mt-1 font-display text-xl font-semibold">{inr(student.monthlyFee)}</p>
                <div className="mt-2"><StatusBadge status={paid ? "paid" : "pending"} /></div>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ClipboardList className="size-3.5" /> Homework
              </p>
              <ul className="space-y-2">
                {homework.length ? (
                  homework.map((h) => (
                    <li key={h.id} className="rounded-xl border border-border p-2.5">
                      <p className="text-sm font-medium">{h.title}</p>
                      <p className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{h.subject} · due {formatDate(h.dueDate)}</span>
                        <StatusBadge status={h.status} />
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">No homework assigned.</li>
                )}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent results
              </p>
              <ul className="space-y-2">
                {results.length ? (
                  results.map(({ exam, result }) => (
                    <li key={exam.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{exam.name}</span>
                        <span className="text-xs text-muted-foreground">
                          class avg {pct(examStats(exam).averagePct)}
                        </span>
                      </span>
                      <span className="font-display font-semibold">
                        {result!.marks}/{exam.maxMarks}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">No results published yet.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <UserRound className="size-3.5" /> Class teacher
              </p>
              <p className="mt-1">{teacher?.name ?? "—"} · {teacher?.phone ?? ""}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Parent logins with WhatsApp updates are on the roadmap.
        </p>
      </div>
    </AppShell>
  );
}

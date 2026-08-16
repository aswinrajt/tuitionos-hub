import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { ReceiptDialog } from "@/components/modals/ReceiptDialog";
import { useStore } from "@/store/tuition-store";
import { CURRENT_MONTH } from "@/data/mock";
import { attendancePct, studentFeeStatus } from "@/lib/selectors";
import { formatDate, formatMonth, formatTime, inr, initials, pct } from "@/lib/format";
import type { FeePayment } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — TuitionOS" },
      {
        name: "description",
        content: "Attendance, fee status, homework and exam results for a single student.",
      },
      { property: "og:title", content: "Student profile — TuitionOS" },
      {
        property: "og:description",
        content: "See attendance percentage, fee history and results for a student.",
      },
    ],
  }),
  component: StudentProfilePage,
});

function StudentProfilePage() {
  const { studentId } = useParams({ from: "/students/$studentId" });
  const store = useStore();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);

  const student = store.students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <AppShell>
        <EmptyState
          icon={UserRound}
          title="Student not found"
          description="This student may have been removed from your centre."
          action={
            <Button onClick={() => navigate({ to: "/students" })}>Back to students</Button>
          }
        />
      </AppShell>
    );
  }

  const batch = store.batches.find((b) => b.id === student.batchId);
  const teacher = store.teachers.find((t) => t.id === batch?.teacherId);
  const attendance = attendancePct(store.attendance, student.id);
  const records = store.attendance.filter((a) => a.entries.some((e) => e.studentId === student.id));
  const presentCount = records.filter(
    (a) => a.entries.find((e) => e.studentId === student.id)?.mark === "present",
  ).length;
  const payments = store.feePayments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => b.month.localeCompare(a.month));
  const feeStatus = studentFeeStatus(store.feePayments, student, CURRENT_MONTH, store.settings.feeDueDay);
  const homework = store.homework.filter((h) => h.batchId === student.batchId).slice(0, 5);
  const results = store.exams
    .filter((e) => e.results.some((r) => r.studentId === student.id))
    .map((e) => ({ exam: e, marks: e.results.find((r) => r.studentId === student.id)?.marks ?? null }));

  return (
    <AppShell>
      <Link to="/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> All students
      </Link>

      <div className="surface-card overflow-hidden">
        <div className="gradient-brand h-20" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <span className="-mt-8 grid size-16 place-items-center rounded-2xl border-4 border-card bg-primary-soft font-display text-xl font-bold text-primary">
              {initials(student.name)}
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold">{student.name}</h1>
              <p className="text-sm text-muted-foreground">
                {student.className} · {batch?.name ?? "No batch"} · Joined {formatDate(student.joiningDate)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={student.status} />
                <StatusBadge status={feeStatus} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 size-4" /> Edit
            </Button>
            <Button onClick={() => setPayOpen(true)}>
              <Wallet className="mr-2 size-4" /> Record fee
            </Button>
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance" value={attendance ? pct(attendance) : "—"} hint={`${presentCount} of ${records.length} classes`} icon={CalendarCheck} tone={attendance >= 75 ? "success" : "warning"} />
        <StatCard label="Monthly fee" value={inr(student.monthlyFee)} hint={`Due on day ${store.settings.feeDueDay}`} icon={Wallet} />
        <StatCard label="Fees paid" value={inr(payments.reduce((s, p) => s + p.amount, 0), { compact: true })} hint={`${payments.length} receipts`} icon={ClipboardList} tone="info" />
        <StatCard
          label="Average score"
          value={
            results.length
              ? pct(
                  results.reduce((sum, r) => sum + ((r.marks ?? 0) / r.exam.maxMarks) * 100, 0) /
                    results.length,
                )
              : "—"
          }
          hint={`${results.length} exams`}
          icon={BookOpen}
          tone="accent"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Student details" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            {[
              ["Student phone", student.phone],
              ["Parent name", student.parentName],
              ["Parent phone", student.parentPhone],
              ["Gender", student.gender],
              ["Class", student.className],
              ["Batch", batch?.name ?? "—"],
              ["Teacher", teacher?.name ?? "—"],
              ["Joining date", formatDate(student.joiningDate)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <Separator className="my-4" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subjects</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {student.subjects.map((s) => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))}
          </div>
          <Separator className="my-4" />
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" /> {student.address}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success(`Calling ${student.parentName}…`)}>
              <Phone className="mr-2 size-4" /> Call parent
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success("Fee reminder sent to parent")}>
              <Mail className="mr-2 size-4" /> Remind
            </Button>
          </div>
        </SectionCard>

        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Attendance summary" description="Across all marked classes">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Present {presentCount} / {records.length}</span>
                <span className="font-semibold">{attendance ? pct(attendance) : "—"}</span>
              </div>
              <Progress value={attendance} />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {records.slice(-24).map((a) => {
                  const mark = a.entries.find((e) => e.studentId === student.id)?.mark;
                  return (
                    <span
                      key={a.id}
                      title={`${formatDate(a.date)} · ${mark}`}
                      className={
                        mark === "present"
                          ? "size-6 rounded-md bg-success-soft"
                          : "size-6 rounded-md bg-destructive-soft"
                      }
                    />
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Fee history" description={`Current month: ${formatMonth(CURRENT_MONTH)}`} bodyClassName="p-0">
            {payments.length ? (
              <ul className="divide-y divide-border">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div>
                      <p className="font-medium">{formatMonth(p.month)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.receiptNo} · {p.method} · {formatDate(p.paidOn)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{inr(p.amount)}</span>
                      <Button variant="ghost" size="sm" onClick={() => setReceipt(p)}>
                        Receipt
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Wallet} title="No payments yet" description="Record the first fee payment for this student." action={<Button size="sm" onClick={() => setPayOpen(true)}>Record fee</Button>} />
            )}
          </SectionCard>

          <div className="grid gap-5 md:grid-cols-2">
            <SectionCard title="Recent homework" bodyClassName="p-0">
              {homework.length ? (
                <ul className="divide-y divide-border">
                  {homework.map((h) => (
                    <li key={h.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{h.title}</p>
                        <StatusBadge status={h.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {h.subject} · due {formatDate(h.dueDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={ClipboardList} title="No homework yet" />
              )}
            </SectionCard>

            <SectionCard title="Recent exam results" bodyClassName="p-0">
              {results.length ? (
                <ul className="divide-y divide-border">
                  {results.map(({ exam, marks }) => (
                    <li key={exam.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{exam.name}</p>
                        <span className="text-sm font-semibold text-primary">
                          {marks ?? "—"}/{exam.maxMarks}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {exam.subject} · {formatDate(exam.date)} ·{" "}
                        {marks !== null ? pct((marks / exam.maxMarks) * 100) : "not graded"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={BookOpen} title="No results yet" />
              )}
            </SectionCard>
          </div>

          {batch ? (
            <SectionCard title="Batch schedule">
              <p className="text-sm">
                <span className="font-medium">{batch.name}</span> · {batch.days.join(", ")} ·{" "}
                {formatTime(batch.startTime)} – {formatTime(batch.endTime)} · {batch.room}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => navigate({ to: "/batches/$batchId", params: { batchId: batch.id } })}
              >
                Open batch
              </Button>
            </SectionCard>
          ) : null}
        </div>
      </div>

      <StudentFormModal open={editOpen} onOpenChange={setEditOpen} student={student} />
      <RecordPaymentModal open={payOpen} onOpenChange={setPayOpen} studentId={student.id} onRecorded={setReceipt} />
      <ReceiptDialog payment={receipt} onOpenChange={() => setReceipt(null)} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${student.name}?`}
        description="The student will be removed from all batches and lists."
        confirmLabel="Delete student"
        destructive
        onConfirm={() => {
          store.deleteStudent(student.id);
          toast.success("Student deleted");
          navigate({ to: "/students" });
        }}
      />
    </AppShell>
  );
}

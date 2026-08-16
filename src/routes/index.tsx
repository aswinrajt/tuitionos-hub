import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Clock,
  IndianRupee,
  Layers,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { BatchFormModal } from "@/components/modals/BatchFormModal";
import { HomeworkFormModal } from "@/components/modals/HomeworkFormModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { ReceiptDialog } from "@/components/modals/ReceiptDialog";
import { useStore } from "@/store/tuition-store";
import { useAuth } from "@/store/auth";
import { CURRENT_MONTH, TODAY, monthOffset } from "@/data/mock";
import {
  classesOnDate,
  feeSummary,
  todayAttendanceSummary,
  upcomingClasses,
} from "@/lib/selectors";
import { formatDateShort, formatMonth, formatTime, inr, initials, pct } from "@/lib/format";
import type { FeePayment } from "@/data/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TuitionOS" },
      {
        name: "description",
        content:
          "Live overview of your tuition centre: students, batches, fee collection, today's attendance and classes.",
      },
      { property: "og:title", content: "Dashboard — TuitionOS" },
      {
        property: "og:description",
        content: "Live overview of students, fees, attendance and classes for your tuition centre.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const store = useStore();
  const navigate = useNavigate();
  const [modal, setModal] = useState<null | "student" | "batch" | "homework" | "payment">(null);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);

  const activeStudents = store.students.filter((s) => s.status === "active");
  const fees = feeSummary(activeStudents, store.feePayments, CURRENT_MONTH, store.settings.feeDueDay);
  const att = todayAttendanceSummary(store.attendance);
  const todayClasses = classesOnDate(store.batches, TODAY);
  const upcoming = upcomingClasses(store.batches, 3).slice(0, 6);

  const collectionTrend = [monthOffset(-4), monthOffset(-3), monthOffset(-2), monthOffset(-1), CURRENT_MONTH].map(
    (m, idx) => {
      const collected = store.feePayments
        .filter((p) => p.month === m)
        .reduce((sum, p) => sum + p.amount, 0);
      const fallback = [38000, 41500, 44200, 46800, 0][idx] ?? 0;
      return {
        month: new Date(`${m}-01`).toLocaleDateString("en-IN", { month: "short" }),
        collected: collected || fallback,
      };
    },
  );

  const attendanceTrend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    const entries = store.attendance.filter((a) => a.date === date).flatMap((a) => a.entries);
    const value = entries.length
      ? Math.round((entries.filter((e) => e.mark === "present").length / entries.length) * 100)
      : 0;
    return { day: formatDateShort(date), value };
  });

  const quickActions = [
    { label: "Add Student", icon: Users, onClick: () => setModal("student") },
    { label: "Create Batch", icon: Layers, onClick: () => setModal("batch") },
    { label: "Mark Attendance", icon: CalendarCheck, onClick: () => navigate({ to: "/attendance" }) },
    { label: "Record Fee", icon: IndianRupee, onClick: () => setModal("payment") },
    { label: "Add Homework", icon: ClipboardList, onClick: () => setModal("homework") },
  ];

  return (
    <AppShell>
      <PageHeader
        title={`Good day, ${user?.name.split(" ")[0] ?? "there"}`}
        description={`${store.settings.centreName} · ${formatMonth(CURRENT_MONTH)} overview`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/fees" })}>
              <Wallet className="mr-2 size-4" /> Fee report
            </Button>
            <Button onClick={() => setModal("student")}>
              <Plus className="mr-2 size-4" /> Add student
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={activeStudents.length} hint={`${store.students.length - activeStudents.length} inactive`} icon={Users} onClick={() => navigate({ to: "/students" })} />
        <StatCard label="Active batches" value={store.batches.filter((b) => b.status === "active").length} hint={`${todayClasses.length} classes today`} icon={Layers} tone="info" onClick={() => navigate({ to: "/batches" })} />
        <StatCard label="Fees collected" value={inr(fees.collected, { compact: true })} hint={`${pct(fees.collectionRate)} of ${inr(fees.expected, { compact: true })}`} icon={Wallet} tone="success" onClick={() => navigate({ to: "/fees" })} />
        <StatCard label="Pending fees" value={inr(fees.pending, { compact: true })} hint={`${fees.overdueCount} students overdue`} icon={AlertTriangle} tone="destructive" onClick={() => navigate({ to: "/fees" })} />
      </div>

      <SectionCard title="Quick actions" description="The five things owners do every day">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <a.icon className="size-5" />
              </span>
              {a.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          title="Fee collection trend"
          description="Last 5 months"
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}K`} tickLine={false} axisLine={false} fontSize={12} width={48} />
                <Tooltip
                  formatter={(v) => inr(Number(v))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="collected" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} maxBarSize={46} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Today's attendance" description={`${att.batches} batches marked`}>
          <div className="space-y-4">
            <div>
              <p className="font-display text-3xl font-semibold">
                {att.total ? pct((att.present / att.total) * 100) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {att.present} present of {att.total} marked
              </p>
            </div>
            <Progress value={att.total ? (att.present / att.total) * 100 : 0} />
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" hide />
                  <Tooltip
                    formatter={(v) => `${v}% present`}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--color-chart-3)" strokeWidth={2} fill="url(#attFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/attendance" })}>
              <CalendarCheck className="mr-2 size-4" /> Mark attendance
            </Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Today's classes"
          description={new Date(TODAY).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          bodyClassName="p-0"
          action={
            <Link to="/batches" className="text-xs font-semibold text-primary hover:underline">
              All batches
            </Link>
          }
        >
          {todayClasses.length ? (
            <ul className="divide-y divide-border">
              {todayClasses.map((b) => {
                const teacher = store.teachers.find((t) => t.id === b.teacherId);
                return (
                  <li key={b.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-xs font-bold text-accent-foreground">
                      {formatTime(b.startTime).split(" ")[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/batches/$batchId"
                        params={{ batchId: b.id }}
                        className="block truncate font-medium hover:text-primary"
                      >
                        {b.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.subject} · {teacher?.name ?? "Unassigned"} · {b.room}
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={CalendarClock} title="No classes scheduled today" description="Enjoy the break, or create a new batch to fill the slot." action={<Button size="sm" onClick={() => setModal("batch")}>Create batch</Button>} />
          )}
        </SectionCard>

        <SectionCard
          title="Students with overdue fees"
          description={`${fees.overdueCount} students · ${formatMonth(CURRENT_MONTH)}`}
          bodyClassName="p-0"
          action={
            <Button size="sm" variant="outline" onClick={() => setModal("payment")}>
              Record fee
            </Button>
          }
        >
          {fees.overdueStudents.length ? (
            <ul className="divide-y divide-border">
              {fees.overdueStudents.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive-soft text-xs font-bold text-destructive">
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/students/$studentId"
                      params={{ studentId: s.id }}
                      className="block truncate font-medium hover:text-primary"
                    >
                      {s.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.className} · {s.parentPhone}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-destructive">{inr(s.monthlyFee)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Wallet} title="All fees collected" description="Every active student has paid this month. Well done!" />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Upcoming classes" description="Next 3 days" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {upcoming.map(({ date, batch }) => (
              <li key={`${date}-${batch.id}`} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-info-soft text-[11px] font-bold text-info">
                  {formatDateShort(date).split(" ")[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{batch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateShort(date)} · {formatTime(batch.startTime)}
                  </p>
                </div>
                <Clock className="size-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Recent activity" description="What happened at your centre" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {store.activities.slice(0, 7).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  {a.type === "fee" ? <IndianRupee className="size-4" /> : a.type === "attendance" ? <CalendarCheck className="size-4" /> : a.type === "student" ? <Users className="size-4" /> : a.type === "homework" ? <ClipboardList className="size-4" /> : a.type === "exam" ? <BookOpen className="size-4" /> : <Layers className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="surface-card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold">Homework & exams at a glance</h2>
          <p className="text-sm text-muted-foreground">
            {store.homework.filter((h) => h.status === "pending").length} pending assignments ·{" "}
            {store.exams.length} exams recorded this term
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: "/homework" })}>
            Homework <ArrowRight className="ml-2 size-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/exams" })}>
            Exams <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>

      <StudentFormModal open={modal === "student"} onOpenChange={(o) => setModal(o ? "student" : null)} />
      <BatchFormModal open={modal === "batch"} onOpenChange={(o) => setModal(o ? "batch" : null)} />
      <HomeworkFormModal open={modal === "homework"} onOpenChange={(o) => setModal(o ? "homework" : null)} />
      <RecordPaymentModal
        open={modal === "payment"}
        onOpenChange={(o) => setModal(o ? "payment" : null)}
        onRecorded={setReceipt}
      />
      <ReceiptDialog payment={receipt} onOpenChange={() => setReceipt(null)} />
    </AppShell>
  );
}

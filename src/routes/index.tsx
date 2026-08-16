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
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/common/Spinner";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { BatchFormModal } from "@/components/modals/BatchFormModal";
import { HomeworkFormModal } from "@/components/modals/HomeworkFormModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { ReceiptDialog } from "@/components/modals/ReceiptDialog";
import { useAuth } from "@/store/auth";
import { useDashboard } from "@/hooks/api";
import { TODAY, formatDateShort, formatMonth, formatTime, inr, initials, pct } from "@/lib/format";
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

type DashboardData = {
  centreName: string;
  month: string;
  stats: {
    activeStudents: number;
    inactiveStudents: number;
    activeBatches: number;
    classesToday: number;
    feesCollected: number;
    feesExpected: number;
    collectionRate: number;
    feesPending: number;
    overdueCount: number;
    homeworkPending: number;
    examsThisTerm: number;
  };
  todayAttendance: {
    present: number;
    total: number;
    percent?: number;
    batches?: number;
    batchesMarked?: number;
  };
  collectionTrend: { month: string; label: string; collected: number }[];
  attendanceTrend: { date: string; day: string; percent: number }[];
  todayClasses: {
    id: string;
    name: string;
    subject: string;
    teacherName: string;
    room: string;
    startTime: string;
    endTime: string;
  }[];
  upcomingClasses: { date: string; batch: { id: string; name: string; startTime: string } }[];
  overdueStudents: {
    id: string;
    name: string;
    className: string;
    parentPhone: string;
    monthlyFee: number;
  }[];
  activities: { id: string; type: string; message: string; time: string }[];
};

function DashboardPage() {
  const { user } = useAuth();
  const { data } = useDashboard();
  const navigate = useNavigate();
  const [modal, setModal] = useState<null | "student" | "batch" | "homework" | "payment">(null);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);

  const dashboard = data as DashboardData | undefined;

  const quickActions = [
    { label: "Add Student", icon: Users, onClick: () => setModal("student") },
    { label: "Create Batch", icon: Layers, onClick: () => setModal("batch") },
    { label: "Mark Attendance", icon: CalendarCheck, onClick: () => navigate({ to: "/attendance" }) },
    { label: "Record Fee", icon: IndianRupee, onClick: () => setModal("payment") },
    { label: "Add Homework", icon: ClipboardList, onClick: () => setModal("homework") },
  ];

  if (!dashboard) {
    return (
      <AppShell>
        <Skeleton className="h-10 w-64 rounded-xl" />
        <PageSkeleton cards={4} tiles={4} />
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

  const { centreName, month, stats } = dashboard;
  const att = dashboard.todayAttendance ?? { present: 0, total: 0 };
  const collectionTrend = dashboard.collectionTrend ?? [];
  const attendanceTrend = dashboard.attendanceTrend ?? [];
  const todayClasses = dashboard.todayClasses ?? [];
  const upcoming = dashboard.upcomingClasses ?? [];
  const overdueStudents = dashboard.overdueStudents ?? [];
  const activities = dashboard.activities ?? [];
  const batchesMarked = att.batchesMarked ?? att.batches ?? 0;

  return (
    <AppShell>
      <PageHeader
        title={`Good day, ${user?.name.split(" ")[0] ?? "there"}`}
        description={`${centreName} · ${formatMonth(month)} overview`}
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
        <StatCard label="Total students" value={stats.activeStudents} hint={`${stats.inactiveStudents} inactive`} icon={Users} onClick={() => navigate({ to: "/students" })} />
        <StatCard label="Active batches" value={stats.activeBatches} hint={`${stats.classesToday} classes today`} icon={Layers} tone="info" onClick={() => navigate({ to: "/batches" })} />
        <StatCard label="Fees collected" value={inr(stats.feesCollected, { compact: true })} hint={`${pct(stats.collectionRate)} of ${inr(stats.feesExpected, { compact: true })}`} icon={Wallet} tone="success" onClick={() => navigate({ to: "/fees" })} />
        <StatCard label="Pending fees" value={inr(stats.feesPending, { compact: true })} hint={`${stats.overdueCount} students overdue`} icon={AlertTriangle} tone="destructive" onClick={() => navigate({ to: "/fees" })} />
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
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
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

        <SectionCard title="Today's attendance" description={`${batchesMarked} batches marked`}>
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
                  <Area type="monotone" dataKey="percent" stroke="var(--color-chart-3)" strokeWidth={2} fill="url(#attFill)" />
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
              {todayClasses.map((b) => (
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
                      {b.subject} · {b.teacherName} · {b.room}
                    </p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatTime(b.startTime)} – {formatTime(b.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CalendarClock} title="No classes scheduled today" description="Enjoy the break, or create a new batch to fill the slot." action={<Button size="sm" onClick={() => setModal("batch")}>Create batch</Button>} />
          )}
        </SectionCard>

        <SectionCard
          title="Students with overdue fees"
          description={`${stats.overdueCount} students · ${formatMonth(month)}`}
          bodyClassName="p-0"
          action={
            <Button size="sm" variant="outline" onClick={() => setModal("payment")}>
              Record fee
            </Button>
          }
        >
          {overdueStudents.length ? (
            <ul className="divide-y divide-border">
              {overdueStudents.slice(0, 6).map((s) => (
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
            {activities.slice(0, 7).map((a) => (
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
            {stats.homeworkPending} pending assignments · {stats.examsThisTerm} exams recorded this term
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

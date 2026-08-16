import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarCheck, ClipboardList, Layers, Pencil, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BatchFormModal } from "@/components/modals/BatchFormModal";
import { HomeworkFormModal } from "@/components/modals/HomeworkFormModal";
import { useBatch, type BatchRow } from "@/hooks/api";
import { formatDate, formatDateShort, formatTime, inr, initials, pct } from "@/lib/format";
import type { Homework, Student } from "@/data/types";

export const Route = createFileRoute("/batches/$batchId")({
  head: () => ({
    meta: [
      { title: "Batch details — TuitionOS" },
      {
        name: "description",
        content: "Batch roster, schedule, teacher, attendance rate and assigned homework.",
      },
      { property: "og:title", content: "Batch details — TuitionOS" },
      { property: "og:description", content: "See the roster, schedule and attendance for a batch." },
    ],
  }),
  component: BatchDetailPage,
});

type RosterStudent = Pick<Student, "id" | "name" | "phone" | "parentName" | "monthlyFee" | "status"> & {
  attendancePercent?: number;
};

type BatchDetail = BatchRow & {
  isToday?: boolean;
  upcoming?: { date: string; startTime: string; endTime: string }[];
  roster?: RosterStudent[];
  students?: RosterStudent[];
  homework?: Pick<Homework, "id" | "title" | "dueDate" | "status">[];
  exams?: { id: string; name: string; subject: string; date: string; maxMarks: number }[];
};

function BatchDetailPage() {
  const { batchId } = useParams({ from: "/batches/$batchId" });
  const navigate = useNavigate();
  const { data, isLoading, isError } = useBatch(batchId);
  const [editOpen, setEditOpen] = useState(false);
  const [hwOpen, setHwOpen] = useState(false);

  const batch = data as BatchDetail | undefined;

  if (isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </AppShell>
    );
  }

  if (isError || !batch) {
    return (
      <AppShell>
        <EmptyState
          icon={Layers}
          title="Batch not found"
          description="This batch may have been deleted."
          action={<Button onClick={() => navigate({ to: "/batches" })}>Back to batches</Button>}
        />
      </AppShell>
    );
  }

  const roster = batch.roster ?? batch.students ?? [];
  const homework = batch.homework ?? [];
  const exams = batch.exams ?? [];
  const upcoming = (batch.upcoming ?? []).slice(0, 5);
  const isToday = Boolean(batch.isToday);

  const columns: Column<RosterStudent>[] = [
    {
      key: "name",
      header: "Student",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            {initials(s.name)}
          </span>
          <div>
            <p className="font-medium">{s.name}</p>
            <p className="text-xs text-muted-foreground">{s.phone}</p>
          </div>
        </div>
      ),
    },
    { key: "parent", header: "Parent", cell: (s) => s.parentName },
    { key: "fee", header: "Monthly fee", cell: (s) => inr(s.monthlyFee) },
    {
      key: "attendance",
      header: "Attendance",
      cell: (s) => (s.attendancePercent != null ? pct(s.attendancePercent) : "—"),
    },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
  ];

  return (
    <AppShell>
      <Link to="/batches" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> All batches
      </Link>

      <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">{batch.name}</h1>
            <StatusBadge status={batch.status} />
            {isToday ? <Badge className="bg-accent-soft text-accent-foreground">Class today</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {batch.className} · {batch.subject} · {batch.teacherName || "Unassigned"} · {batch.room}
          </p>
          <p className="text-sm text-muted-foreground">
            {batch.days.join(", ")} · {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" /> Edit batch
          </Button>
          <Button variant="outline" onClick={() => setHwOpen(true)}>
            <ClipboardList className="mr-2 size-4" /> Add homework
          </Button>
          <Button onClick={() => navigate({ to: "/attendance" })}>
            <CalendarCheck className="mr-2 size-4" /> Mark attendance
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={roster.length} icon={Users} />
        <StatCard label="Attendance rate" value={pct(batch.attendancePercent)} icon={CalendarCheck} tone="success" />
        <StatCard label="Homework assigned" value={homework.length} hint={`${homework.filter((h) => h.status === "pending").length} pending`} icon={ClipboardList} tone="info" />
        <StatCard label="Monthly revenue" value={inr(batch.monthlyRevenue, { compact: true })} icon={Layers} tone="accent" />
      </div>

      <SectionCard title="Student list" description={`${roster.length} students in this batch`} bodyClassName="p-0">
        <DataTable
          columns={columns}
          rows={roster}
          onRowClick={(s) => navigate({ to: "/students/$studentId", params: { studentId: s.id } })}
          empty={<EmptyState icon={Users} title="No students in this batch" description="Add students and assign them to this batch." />}
        />
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Upcoming classes" bodyClassName="p-0">
          {upcoming.length ? (
            <ul className="divide-y divide-border">
              {upcoming.map(({ date, startTime, endTime }) => (
                <li key={date} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{formatDateShort(date)}</span>
                  <span className="text-muted-foreground">
                    {formatTime(startTime ?? batch.startTime)} – {formatTime(endTime ?? batch.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CalendarCheck} title="No classes in the next week" />
          )}
        </SectionCard>

        <SectionCard title="Homework & exams" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {homework.slice(0, 4).map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(h.dueDate)}</p>
                </div>
                <StatusBadge status={h.status} />
              </li>
            ))}
            {exams.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.subject} · {formatDate(e.date)} · max {e.maxMarks}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/exams" })}>
                  Results
                </Button>
              </li>
            ))}
            {!homework.length && !exams.length ? (
              <li>
                <EmptyState icon={ClipboardList} title="Nothing assigned yet" action={<Button size="sm" onClick={() => setHwOpen(true)}>Add homework</Button>} />
              </li>
            ) : null}
          </ul>
        </SectionCard>
      </div>

      <BatchFormModal open={editOpen} onOpenChange={setEditOpen} batch={batch} />
      <HomeworkFormModal open={hwOpen} onOpenChange={setHwOpen} defaultBatchId={batch.id} />
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarCheck, Check, CheckCheck, Save, UserX, X } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/tuition-store";
import { TODAY } from "@/data/mock";
import { attendancePct, batchAttendancePct, todayAttendanceSummary } from "@/lib/selectors";
import { formatDate, initials, pct } from "@/lib/format";
import type { AttendanceMark } from "@/data/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — TuitionOS" },
      {
        name: "description",
        content: "Mark batch attendance in seconds and track attendance percentage over time.",
      },
      { property: "og:title", content: "Attendance — TuitionOS" },
      { property: "og:description", content: "Mark present/absent for a batch and review history." },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const store = useStore();
  const [batchId, setBatchId] = useState(store.batches[0]?.id ?? "");
  const [date, setDate] = useState(TODAY);
  const [draft, setDraft] = useState<Record<string, AttendanceMark> | null>(null);

  const roster = store.students.filter((s) => s.batchId === batchId && s.status === "active");
  const saved = store.attendance.find((a) => a.batchId === batchId && a.date === date);

  const marks = useMemo(() => {
    if (draft) return draft;
    const base: Record<string, AttendanceMark> = {};
    roster.forEach((s) => {
      base[s.id] = saved?.entries.find((e) => e.studentId === s.id)?.mark ?? "present";
    });
    return base;
  }, [draft, roster, saved]);

  const presentCount = roster.filter((s) => marks[s.id] === "present").length;
  const today = todayAttendanceSummary(store.attendance);
  const history = store.attendance
    .filter((a) => a.batchId === batchId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);

  const setMark = (studentId: string, mark: AttendanceMark) =>
    setDraft({ ...marks, [studentId]: mark });

  const pieData = [
    { name: "Present", value: presentCount },
    { name: "Absent", value: roster.length - presentCount },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Attendance"
        description="Pick a batch and date, then mark students present or absent."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              const all: Record<string, AttendanceMark> = {};
              roster.forEach((s) => (all[s.id] = "present"));
              setDraft(all);
              toast.success("All students marked present");
            }}
            disabled={!roster.length}
          >
            <CheckCheck className="mr-2 size-4" /> Mark all present
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's attendance" value={today.total ? pct((today.present / today.total) * 100) : "—"} hint={`${today.present}/${today.total} present`} icon={CalendarCheck} tone="success" />
        <StatCard label="Batches marked today" value={today.batches} hint={`of ${store.batches.length} batches`} icon={Check} tone="info" />
        <StatCard label="Selected batch rate" value={pct(batchAttendancePct(store.attendance, batchId))} hint="All-time average" icon={CalendarCheck} />
        <StatCard label="Absent today" value={today.total - today.present} hint="Across all marked batches" icon={UserX} tone="destructive" />
      </div>

      <SectionCard bodyClassName="p-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch</p>
            <Select
              value={batchId}
              onValueChange={(v) => {
                setBatchId(v);
                setDraft(null);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
              <SelectContent>
                {store.batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} · {b.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setDraft(null);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {saved ? <StatusBadge status="completed" /> : <StatusBadge status="pending" />}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard
          title={`Roster · ${formatDate(date)}`}
          description={`${presentCount} present · ${roster.length - presentCount} absent`}
          className="lg:col-span-2"
          bodyClassName="p-0"
          action={
            <Button
              size="sm"
              onClick={() => {
                store.saveAttendance(
                  batchId,
                  date,
                  roster.map((s) => ({ studentId: s.id, mark: marks[s.id] ?? "present" })),
                );
                setDraft(null);
                toast.success("Attendance saved");
              }}
              disabled={!roster.length}
            >
              <Save className="mr-2 size-4" /> Save
            </Button>
          }
        >
          {roster.length ? (
            <ul className="divide-y divide-border">
              {roster.map((s) => {
                const mark = marks[s.id] ?? "present";
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                      {initials(s.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Overall {pct(attendancePct(store.attendance, s.id))}
                      </p>
                    </div>
                    <div className="flex overflow-hidden rounded-lg border border-border">
                      <button
                        onClick={() => setMark(s.id, "present")}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors",
                          mark === "present" ? "bg-success text-success-foreground" : "hover:bg-muted",
                        )}
                      >
                        <Check className="size-3.5" /> Present
                      </button>
                      <button
                        onClick={() => setMark(s.id, "absent")}
                        className={cn(
                          "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors",
                          mark === "absent" ? "bg-destructive text-destructive-foreground" : "hover:bg-muted",
                        )}
                      >
                        <X className="size-3.5" /> Absent
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={UserX}
              title="No active students in this batch"
              description="Assign students to this batch to start marking attendance."
            />
          )}
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Visual summary" description={formatDate(date)}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    <Cell fill="var(--color-chart-3)" />
                    <Cell fill="var(--color-chart-5)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Present</span>
                <span className="font-semibold">
                  {roster.length ? pct((presentCount / roster.length) * 100) : "—"}
                </span>
              </div>
              <Progress value={roster.length ? (presentCount / roster.length) * 100 : 0} />
            </div>
          </SectionCard>

          <SectionCard title="Attendance history" description="Last 12 sessions" bodyClassName="p-0">
            {history.length ? (
              <ul className="divide-y divide-border">
                {history.map((a) => {
                  const present = a.entries.filter((e) => e.mark === "present").length;
                  return (
                    <li key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <button
                        className="font-medium hover:text-primary"
                        onClick={() => {
                          setDate(a.date);
                          setDraft(null);
                        }}
                      >
                        {formatDate(a.date)}
                      </button>
                      <span className="text-muted-foreground">
                        {present}/{a.entries.length} · {pct((present / a.entries.length) * 100)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={CalendarCheck} title="No history yet" description="Saved attendance will appear here." />
            )}
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ParentCard, ParentEmpty, ParentPageTitle, ParentScreenLoading, ParentShell, useParentContext } from "@/components/parent/ParentShell";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { attendanceCalendar } from "@/lib/parent";
import { useParentAuth } from "@/store/parent-auth";
import { useParentAttendance } from "@/hooks/api";
import { CURRENT_MONTH, formatDate, formatMonth, pct } from "@/lib/format";

export const Route = createFileRoute("/parent/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — TuitionOS Parent Portal" },
      { name: "description", content: "A month-by-month attendance calendar for your child with present and absent days marked clearly." },
      { property: "og:title", content: "Attendance — TuitionOS Parent Portal" },
      { property: "og:description", content: "See every present and absent day your child has this month." },
    ],
  }),
  component: ParentAttendancePage,
});

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function ParentAttendancePage() {
  const { activeChildId } = useParentAuth();
  const { child } = useParentContext();
  const studentId = child?.id ?? activeChildId;
  const [month, setMonth] = useState(CURRENT_MONTH);
  const { data, isLoading } = useParentAttendance(studentId, month);

  if (!studentId) {
    return (
      <ParentShell>
        <ParentEmpty title="No child linked" />
      </ParentShell>
    );
  }

  if (isLoading || !data) {
    return (
      <ParentShell>
        <ParentScreenLoading />
      </ParentShell>
    );
  }

  const cells = attendanceCalendar(data.month.days, month);
  const firstName = (child?.name ?? "your child").split(" ")[0];

  return (
    <ParentShell>
      <ParentPageTitle title="Attendance" description={`How often ${firstName} attended class.`} />

      <ParentCard>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall attendance</p>
            <p className="font-display text-3xl font-semibold">{pct(data.overall.percent)}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.overall.present} present · {data.overall.absent} absent
          </p>
        </div>
        <Progress value={data.overall.percent} className="mt-3" />
        <p className="mt-2 text-xs text-muted-foreground">
          {data.overall.percent >= 90
            ? "Excellent attendance. Keep it up!"
            : data.overall.percent >= 75
              ? "Good attendance. Try not to miss classes."
              : "Attendance is low. Please speak to the class teacher."}
        </p>
      </ParentCard>

      <ParentCard>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="size-5" />
          </Button>
          <p className="font-display text-sm font-semibold">{formatMonth(month)}</p>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            disabled={month >= CURRENT_MONTH}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, i) =>
            cell ? (
              <div
                key={cell.date}
                className={[
                  "grid aspect-square place-items-center rounded-lg text-sm font-medium",
                  cell.mark === "present"
                    ? "bg-primary text-primary-foreground"
                    : cell.mark === "absent"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted/60 text-muted-foreground",
                ].join(" ")}
              >
                {Number(cell.date.slice(-2))}
              </div>
            ) : (
              <div key={`blank-${i}`} />
            ),
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> Present</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-destructive/30" /> Absent</span>
          <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-muted" /> No class</span>
        </div>
        <p className="mt-2 text-sm">
          <span className="font-semibold">{data.month.present}</span> of {data.month.total} classes attended in {formatMonth(month)}.
        </p>
      </ParentCard>

      <ParentCard title="Monthly trend">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(v: number) => [`${Math.round(v)}%`, "Attendance"]} />
              <Bar dataKey="percent" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ParentCard>

      <ParentCard title="Recent absences">
        {data.recentAbsences.length ? (
          <ul className="space-y-2">
            {data.recentAbsences.map((r) => (
              <li key={r.date} className="flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2.5 text-sm">
                <span className="font-medium">{formatDate(r.date)}</span>
                <span className="text-destructive">Absent</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No absences recorded. Wonderful!</p>
        )}
      </ParentCard>
    </ParentShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Wallet,
} from "lucide-react";
import { ParentCard, ParentEmpty, ParentShell, useParentContext } from "@/components/parent/ParentShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CURRENT_MONTH, TODAY } from "@/data/mock";
import { studentFeeStatus, weekdayOf } from "@/lib/selectors";
import {
  childAttendanceSummary,
  childExams,
  childHomework,
  childSchedule,
  nextClassFor,
} from "@/lib/parent";
import { formatDate, formatTime, inr, pct } from "@/lib/format";

export const Route = createFileRoute("/parent/")({
  head: () => ({
    meta: [
      { title: "Parent dashboard — TuitionOS" },
      {
        name: "description",
        content: "Attendance, fee status, next class, pending homework and latest results for your child at a glance.",
      },
      { property: "og:title", content: "Parent dashboard — TuitionOS" },
      { property: "og:description", content: "Your child's tuition progress in one simple screen." },
    ],
  }),
  component: ParentDashboard,
});

function ParentDashboard() {
  const { child, account, store } = useParentContext();

  if (!child) {
    return (
      <ParentShell>
        <ParentEmpty
          title="No child linked yet"
          body="Please ask the tuition centre to link your child to this mobile number."
        />
      </ParentShell>
    );
  }

  const batch = store.batches.find((b) => b.id === child.batchId);
  const teacher = store.teachers.find((t) => t.id === batch?.teacherId);
  const attendance = childAttendanceSummary(store.attendance, child);
  const feeStatus = studentFeeStatus(store.feePayments, child, CURRENT_MONTH, store.settings.feeDueDay);
  const homework = childHomework(store.homework, child);
  const pendingHw = homework.filter((h) => h.status === "pending");
  const latest = childExams(store.exams, child)[0];
  const next = nextClassFor(store.batches, child);
  const todayClasses = childSchedule(store.batches, child).find(
    (d) => d.day === weekdayOf(TODAY),
  );
  const announcements = store.announcements
    .filter((a) => a.audience === "all" || a.audience === child.batchId)
    .slice(0, 2);

  return (
    <ParentShell>
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="text-xs uppercase tracking-wide text-primary-foreground/80">
          Namaste {account?.name.split(" ")[0] ?? "Parent"}
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold">{child.name}</h1>
        <p className="text-sm text-primary-foreground/85">
          {child.className} · {batch?.name ?? "No batch"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/parent/attendance" className="rounded-2xl border border-border bg-background p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" /> Attendance
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">{pct(attendance.percent)}</p>
          <Progress value={attendance.percent} className="mt-2" />
        </Link>

        <Link to="/parent/fees" className="rounded-2xl border border-border bg-background p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Wallet className="size-3.5" /> Fees
          </p>
          <p className="mt-1 font-display text-2xl font-semibold capitalize">
            {feeStatus === "paid" ? "Paid" : feeStatus}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{inr(child.monthlyFee)} this month</p>
        </Link>

        <Link to="/parent/homework" className="rounded-2xl border border-border bg-background p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ClipboardList className="size-3.5" /> Homework
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">{pendingHw.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">pending</p>
        </Link>

        <Link to="/parent/exams" className="rounded-2xl border border-border bg-background p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BookOpen className="size-3.5" /> Last result
          </p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {latest ? pct(latest.percent) : "—"}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {latest ? latest.exam.subject : "No result yet"}
          </p>
        </Link>
      </div>

      <ParentCard title="Next class">
        {next ? (
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <CalendarClock className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold">{next.batch.subject}</p>
              <p className="text-sm text-muted-foreground">
                {next.isToday ? "Today" : next.day} · {formatTime(next.batch.startTime)} – {formatTime(next.batch.endTime)}
              </p>
              <p className="text-xs text-muted-foreground">
                {next.batch.room} · {store.teachers.find((t) => t.id === next.batch.teacherId)?.name ?? "Teacher"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming class in the timetable.</p>
        )}
        <Button asChild variant="outline" size="sm" className="mt-3 w-full">
          <Link to="/parent/schedule">
            See full timetable <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </Button>
      </ParentCard>

      <ParentCard title={`Today's classes (${todayClasses?.classes.length ?? 0})`}>
        {todayClasses?.classes.length ? (
          <ul className="space-y-2">
            {todayClasses.classes.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 p-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{b.subject}</span>
                  <span className="text-xs text-muted-foreground">{b.room}</span>
                </span>
                <span className="shrink-0 text-sm font-medium">{formatTime(b.startTime)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No classes scheduled today. Enjoy the break!</p>
        )}
      </ParentCard>

      <ParentCard
        title="Pending homework"
        action={
          <Link to="/parent/homework" className="text-xs font-semibold text-primary">
            View all
          </Link>
        }
      >
        {pendingHw.length ? (
          <ul className="space-y-2">
            {pendingHw.slice(0, 3).map((h) => (
              <li key={h.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{h.title}</p>
                <p className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{h.subject}</span>
                  <span>Due {formatDate(h.dueDate)}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">All homework is completed. Well done!</p>
        )}
      </ParentCard>

      <ParentCard
        title="Latest result"
        action={
          <Link to="/parent/exams" className="text-xs font-semibold text-primary">
            All results
          </Link>
        }
      >
        {latest ? (
          <div>
            <p className="font-display text-base font-semibold">{latest.exam.name}</p>
            <p className="text-xs text-muted-foreground">
              {latest.exam.subject} · {formatDate(latest.exam.date)}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <p className="font-display text-2xl font-semibold">
                {latest.marks}
                <span className="text-sm text-muted-foreground">/{latest.exam.maxMarks}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Class average {pct(latest.classAveragePct)}
              </p>
            </div>
            <Progress value={latest.percent} className="mt-2" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No results published yet.</p>
        )}
      </ParentCard>

      <ParentCard
        title="Announcements"
        action={
          <Link to="/parent/notifications" className="text-xs font-semibold text-primary">
            View all
          </Link>
        }
      >
        {announcements.length ? (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-foreground">
                  <Megaphone className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{a.title}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{a.body}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {formatDate(a.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No announcements right now.</p>
        )}
      </ParentCard>

      <ParentCard title="Quick actions">
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/parent/child">Child profile</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/parent/fees">Pay fees</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/parent/attendance">Attendance</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/parent/notifications">Notifications</Link></Button>
        </div>
        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          Class teacher: {teacher?.name ?? "—"} · {teacher?.phone ?? ""}
        </div>
      </ParentCard>
      <div className="pb-2" />
    </ParentShell>
  );
}

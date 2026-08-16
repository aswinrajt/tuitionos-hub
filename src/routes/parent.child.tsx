import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, GraduationCap, MapPin, Phone, User2, Wallet } from "lucide-react";
import {
  ParentCard,
  ParentEmpty,
  ParentPageTitle,
  ParentScreenLoading,
  ParentShell,
  useParentContext,
} from "@/components/parent/ParentShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useParentAuth } from "@/store/parent-auth";
import { useParentChild } from "@/hooks/api";
import { formatDate, formatTime, initials, inr, pct } from "@/lib/format";

export const Route = createFileRoute("/parent/child")({
  head: () => ({
    meta: [
      { title: "Child profile — TuitionOS Parent Portal" },
      { name: "description", content: "Your child's batch, subjects, class teacher, fee plan and overall performance summary." },
      { property: "og:title", content: "Child profile — TuitionOS Parent Portal" },
      { property: "og:description", content: "Batch, subjects, teacher contact and performance in one card." },
    ],
  }),
  component: ChildProfilePage,
});

function ChildProfilePage() {
  const { activeChildId } = useParentAuth();
  const { child: option } = useParentContext();
  const studentId = option?.id ?? activeChildId;
  const { data: child, isLoading } = useParentChild(studentId);

  if (!studentId) {
    return (
      <ParentShell>
        <ParentEmpty title="No child linked" body="Please contact the tuition centre." />
      </ParentShell>
    );
  }

  if (isLoading || !child) {
    return (
      <ParentShell>
        <ParentScreenLoading />
      </ParentShell>
    );
  }

  const batch = child.batch;

  return (
    <ParentShell>
      <ParentPageTitle title="Child profile" description="Details the tuition centre has on record." />

      <ParentCard>
        <div className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            {initials(child.name)}
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{child.name}</p>
            <p className="text-sm text-muted-foreground">
              {child.className} · {batch?.name ?? "No batch"}
            </p>
            <Badge variant="secondary" className="mt-1 capitalize">{child.status}</Badge>
          </div>
        </div>
        <dl className="mt-4 space-y-2.5 text-sm">
          <Row icon={GraduationCap} label="Joined" value={formatDate(child.joiningDate)} />
          <Row icon={Wallet} label="Monthly fee" value={`${inr(child.monthlyFee)} · ${child.feeStatus}`} />
          <Row icon={User2} label="Parent / guardian" value={child.parentName} />
          <Row icon={Phone} label="Contact" value={child.parentPhone} />
          <Row icon={MapPin} label="Address" value={child.address} />
        </dl>
      </ParentCard>

      <ParentCard title="Subjects enrolled">
        <div className="flex flex-wrap gap-2">
          {child.subjects.map((s) => (
            <Badge key={s} variant="outline">{s}</Badge>
          ))}
        </div>
      </ParentCard>

      <ParentCard title="Performance summary">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Attendance</span>
              <span className="font-semibold">{pct(child.attendancePercent)}</span>
            </div>
            <Progress value={child.attendancePercent} className="mt-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">
              {child.attendancePresent} present of {child.attendanceTotal} classes
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Average exam score</span>
              <span className="font-semibold">{child.examCount ? pct(child.examAverage) : "—"}</span>
            </div>
            <Progress value={child.examAverage} className="mt-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">{child.examCount} results published</p>
          </div>
        </div>
      </ParentCard>

      <ParentCard title="Batch & class teacher">
        {batch ? (
          <div className="space-y-2 text-sm">
            <p className="font-display text-base font-semibold">{batch.name}</p>
            <p className="text-muted-foreground">
              {batch.days.join(", ")} · {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
            </p>
            <p className="text-muted-foreground">Room {batch.room}</p>
            <div className="mt-3 rounded-xl bg-muted/50 p-3">
              <p className="font-medium">{batch.teacherName}</p>
              <p className="text-xs text-muted-foreground">{batch.teacherQualification}</p>
              {batch.teacherPhone ? (
                <a href={`tel:${batch.teacherPhone.replace(/\s/g, "")}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Phone className="size-4" /> Call {batch.teacherPhone}
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No batch assigned yet.</p>
        )}
      </ParentCard>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline"><Link to="/parent/attendance"><CalendarDays className="mr-1.5 size-4" /> Attendance</Link></Button>
        <Button asChild variant="outline"><Link to="/parent/homework"><ClipboardList className="mr-1.5 size-4" /> Homework</Link></Button>
      </div>
    </ParentShell>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium capitalize">{value}</dd>
    </div>
  );
}

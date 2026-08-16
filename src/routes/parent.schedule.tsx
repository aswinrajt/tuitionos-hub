import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, User2 } from "lucide-react";
import {
  ParentCard,
  ParentEmpty,
  ParentPageTitle,
  ParentScreenLoading,
  ParentShell,
  useParentContext,
} from "@/components/parent/ParentShell";
import { Badge } from "@/components/ui/badge";
import { useParentAuth } from "@/store/parent-auth";
import { useParentSchedule } from "@/hooks/api";
import { formatTime } from "@/lib/format";

export const Route = createFileRoute("/parent/schedule")({
  head: () => ({
    meta: [
      { title: "Class schedule — TuitionOS Parent Portal" },
      { name: "description", content: "Your child's weekly tuition timetable with timings, room and teacher for each class." },
      { property: "og:title", content: "Class schedule — TuitionOS Parent Portal" },
      { property: "og:description", content: "Weekly timetable with timings, rooms and teachers." },
    ],
  }),
  component: ParentSchedulePage,
});

function ParentSchedulePage() {
  const { activeChildId } = useParentAuth();
  const { child } = useParentContext();
  const studentId = child?.id ?? activeChildId;
  const { data, isLoading } = useParentSchedule(studentId);

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

  const firstName = (child?.name ?? "your child").split(" ")[0];

  return (
    <ParentShell>
      <ParentPageTitle title="Class schedule" description={`Weekly timetable for ${firstName}.`} />

      {data.days.map((day) => (
        <ParentCard
          key={day.day}
          className={day.day === data.today ? "border-primary/50" : undefined}
          title={day.day === data.today ? `${day.day} · Today` : day.day}
        >
          {day.classes.length ? (
            <ul className="space-y-2">
              {day.classes.map((b) => (
                <li key={`${day.day}-${b.batchId}-${b.startTime}`} className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-sm font-semibold">{b.subject}</p>
                    <Badge variant="outline" className="shrink-0">{b.className}</Badge>
                  </div>
                  <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </p>
                    <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {b.room}</p>
                    <p className="flex items-center gap-1.5"><User2 className="size-3.5" /> {b.teacherName}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No classes.</p>
          )}
        </ParentCard>
      ))}
    </ParentShell>
  );
}

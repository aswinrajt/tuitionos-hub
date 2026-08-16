import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, CalendarDays, ClipboardList, Megaphone, Wallet } from "lucide-react";
import {
  ParentCard,
  ParentEmpty,
  ParentPageTitle,
  ParentScreenLoading,
  ParentShell,
  useParentContext,
} from "@/components/parent/ParentShell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParentAuth } from "@/store/parent-auth";
import { useParentNotifications, type ParentNotificationItem } from "@/hooks/api";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/parent/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — TuitionOS Parent Portal" },
      { name: "description", content: "Fee reminders, absence alerts, new homework, published results and centre announcements in one feed." },
      { property: "og:title", content: "Notifications — TuitionOS Parent Portal" },
      { property: "og:description", content: "Every update from the tuition centre in one simple feed." },
    ],
  }),
  component: ParentNotificationsPage,
});

const meta: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }> = {
  fee: { icon: Wallet, tone: "bg-accent-soft text-accent-foreground", label: "Fees" },
  attendance: { icon: CalendarDays, tone: "bg-destructive/15 text-destructive", label: "Attendance" },
  homework: { icon: ClipboardList, tone: "bg-primary-soft text-primary", label: "Homework" },
  exam: { icon: BookOpen, tone: "bg-secondary text-secondary-foreground", label: "Results" },
  announcement: { icon: Megaphone, tone: "bg-muted text-foreground", label: "Notice" },
};

function ParentNotificationsPage() {
  const { activeChildId } = useParentAuth();
  const { child } = useParentContext();
  const studentId = child?.id ?? activeChildId;
  const [filter, setFilter] = useState<"all" | ParentNotificationItem["kind"]>("all");
  const { data: items = [], isLoading } = useParentNotifications(studentId, filter === "all" ? undefined : filter);

  if (!studentId) {
    return (
      <ParentShell>
        <ParentEmpty title="No child linked" />
      </ParentShell>
    );
  }

  if (isLoading) {
    return (
      <ParentShell>
        <ParentScreenLoading />
      </ParentShell>
    );
  }

  return (
    <ParentShell>
      <ParentPageTitle
        title="Notifications"
        description="Everything the centre has recorded for your child, newest first."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="fee">Fees</TabsTrigger>
          <TabsTrigger value="homework">Work</TabsTrigger>
          <TabsTrigger value="announcement">Notices</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length ? (
        <ParentCard>
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const m = meta[n.kind] ?? meta["announcement"]!;
              return (
                <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${m.tone}`}>
                    <m.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(n.date)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                    <span className="mt-1 inline-block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {m.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </ParentCard>
      ) : (
        <ParentEmpty title="Nothing here" body="New updates from the centre will appear here." />
      )}
    </ParentShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Clock, Layers, MoreVertical, Pencil, Plus, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { BatchFormModal } from "@/components/modals/BatchFormModal";
import { useBatches, useDeleteBatch, useSchedule, type BatchRow } from "@/hooks/api";
import { TODAY, formatDateShort, formatTime, pct, shift } from "@/lib/format";
import type { Batch } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/batches/")({
  head: () => ({
    meta: [
      { title: "Batches — TuitionOS" },
      {
        name: "description",
        content: "Create and manage batches with teachers, subjects, schedules and student counts.",
      },
      { property: "og:title", content: "Batches — TuitionOS" },
      { property: "og:description", content: "Manage batch schedules, teachers and student rosters." },
    ],
  }),
  component: BatchesPage,
});

type ScheduleItem = { date: string; batch: BatchRow };

function BatchesPage() {
  const navigate = useNavigate();
  const { data: allBatches = [], isLoading } = useBatches();
  const { data: scheduleData } = useSchedule(TODAY, shift(3));
  const deleteBatch = useDeleteBatch();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | undefined>();
  const [toDelete, setToDelete] = useState<Batch | null>(null);

  const batches = allBatches.filter((b) =>
    `${b.name} ${b.subject} ${b.className}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const schedule = (scheduleData as ScheduleItem[] | undefined) ?? [];
  const todayClasses = schedule.filter((item) => item.date === TODAY).map((item) => item.batch);
  const upcoming = schedule.filter((item) => item.date > TODAY).slice(0, 8);

  return (
    <AppShell>
      <PageHeader
        title="Batches"
        description={`${allBatches.length} batches · ${todayClasses.length} classes scheduled today`}
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Create batch
          </Button>
        }
      />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search batches by name, subject or class"
        className="max-w-md"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : batches.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((b) => (
            <div key={b.id} className="surface-card flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to="/batches/$batchId"
                    params={{ batchId: b.id }}
                    className="font-display text-base font-semibold hover:text-primary"
                  >
                    {b.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {b.className} · {b.subject}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Batch actions">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate({ to: "/batches/$batchId", params: { batchId: b.id } })}>
                      View batch
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(b);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/attendance" })}>
                      Mark attendance
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(b)}>
                      <Trash2 className="mr-2 size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {b.days.map((d) => (
                  <Badge key={d} variant="secondary" className="text-[11px]">{d}</Badge>
                ))}
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Teacher</dt>
                  <dd className="font-medium">{b.teacherName || "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Timing</dt>
                  <dd className="font-medium">
                    {formatTime(b.startTime)} – {formatTime(b.endTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Students</dt>
                  <dd className="font-medium">{b.studentCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Attendance</dt>
                  <dd className="font-medium">{pct(b.attendancePercent)}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <StatusBadge status={b.status} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/batches/$batchId", params: { batchId: b.id } })}
                >
                  Open <Users className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SectionCard bodyClassName="p-0">
          <EmptyState
            icon={Layers}
            title="No batches found"
            description="Create your first batch to start scheduling classes and marking attendance."
            action={<Button size="sm" onClick={() => setFormOpen(true)}>Create batch</Button>}
          />
        </SectionCard>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Today's classes" bodyClassName="p-0">
          {todayClasses.length ? (
            <ul className="divide-y divide-border">
              {todayClasses.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-xs font-bold text-accent-foreground">
                    {formatTime(b.startTime).split(" ")[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.room} · {b.subject}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate({ to: "/attendance" })}>
                    Mark
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={CalendarClock} title="No classes today" />
          )}
        </SectionCard>

        <SectionCard title="Upcoming classes" description="Next 3 days" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {upcoming.map(({ date, batch }) => (
              <li key={`${date}-${batch.id}`} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-10 place-items-center rounded-xl bg-info-soft text-[11px] font-bold text-info">
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
      </div>

      <BatchFormModal open={formOpen} onOpenChange={setFormOpen} batch={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="Students in this batch will need to be reassigned."
        confirmLabel="Delete batch"
        pendingLabel="Deleting…"
        destructive
        pending={deleteBatch.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteBatch.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Batch deleted");
              setToDelete(null);
            },
          });
        }}
      />
    </AppShell>
  );
}

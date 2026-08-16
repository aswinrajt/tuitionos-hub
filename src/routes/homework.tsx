import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ClipboardList, MoreVertical, Pencil, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HomeworkFormModal } from "@/components/modals/HomeworkFormModal";
import { PageSkeleton } from "@/components/common/Spinner";
import {
  useBatches,
  useDeleteHomework,
  useHomework,
  useHomeworkOne,
  useSettings,
  useShareHomework,
  useUpdateHomework,
} from "@/hooks/api";
import { TODAY, formatDate, initials } from "@/lib/format";
import type { Homework } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/homework")({
  head: () => ({
    meta: [
      { title: "Homework — TuitionOS" },
      {
        name: "description",
        content: "Assign homework to batches with due dates and track pending or completed work.",
      },
      { property: "og:title", content: "Homework — TuitionOS" },
      { property: "og:description", content: "Assign and track homework for every batch." },
    ],
  }),
  component: HomeworkPage,
});

type HomeworkStudent = { id: string; name: string; submissionStatus?: string };

function HomeworkPage() {
  const { data: batches = [] } = useBatches();
  const { data: settings } = useSettings();
  const [batchFilter, setBatchFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Homework | undefined>();
  const [toDelete, setToDelete] = useState<Homework | null>(null);
  const [viewing, setViewing] = useState<Homework | null>(null);

  const { data, isLoading } = useHomework({
    batchId: batchFilter !== "all" ? batchFilter : undefined,
    subject: subjectFilter !== "all" ? subjectFilter : undefined,
    status: tab !== "all" ? tab : undefined,
  });
  const rows = data?.rows ?? [];
  const meta = data?.meta ?? { total: 0, pending: 0, completed: 0, overdue: 0 };
  const { data: homeworkDetail } = useHomeworkOne(viewing?.id ?? "");
  const updateHomework = useUpdateHomework();
  const deleteHomework = useDeleteHomework();
  const shareHomework = useShareHomework();
  const detailStudents = (homeworkDetail?.students ?? []) as HomeworkStudent[];

  return (
    <AppShell>
      <PageHeader
        title="Homework"
        description="Assign work to batches and keep track of what is pending."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Add homework
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total assignments" value={meta.total ?? rows.length} icon={ClipboardList} />
        <StatCard label="Pending" value={meta.pending} hint={`${meta.overdue} past due date`} icon={RotateCcw} tone="warning" />
        <StatCard label="Completed" value={meta.completed} icon={CheckCircle2} tone="success" />
      </div>

      <SectionCard bodyClassName="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {(settings?.subjects ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Done</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </SectionCard>

      {isLoading ? (
        <PageSkeleton cards={0} tiles={6} />
      ) : rows.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((h) => {
            const batch = batches.find((b) => b.id === h.batchId);
            const count = batch?.studentCount ?? 0;
            const isOverdue = h.status === "pending" && h.dueDate < TODAY;
            return (
              <div key={h.id} className="surface-card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{h.subject}</p>
                    <h3 className="font-display text-base font-semibold">{h.title}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Homework actions">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewing(h)}>Student view</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditing(h);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          updateHomework.mutate(
                            { id: h.id, status: h.status === "pending" ? "completed" : "pending" },
                            { onSuccess: () => toast.success(h.status === "pending" ? "Marked completed" : "Reopened") },
                          );
                        }}
                      >
                        <CheckCircle2 className="mr-2 size-4" />
                        {h.status === "pending" ? "Mark completed" : "Reopen"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(h)}>
                        <Trash2 className="mr-2 size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">{h.description}</p>
                <div className="mt-auto space-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <p className="flex items-center justify-between">
                    <span>{h.batchName ?? batch?.name ?? "—"}</span>
                    <span className="flex items-center gap-1"><Users className="size-3.5" /> {count}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className={isOverdue ? "font-semibold text-destructive" : ""}>
                      Due {formatDate(h.dueDate)}
                    </span>
                    <StatusBadge status={isOverdue ? "overdue" : h.status} />
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewing(h)}>
                  Open student view
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <SectionCard bodyClassName="p-0">
          <EmptyState
            icon={ClipboardList}
            title="No homework here"
            description="Assign homework to a batch, or clear the filters to see everything."
            action={<Button size="sm" onClick={() => setFormOpen(true)}>Add homework</Button>}
          />
        </SectionCard>
      )}

      <HomeworkFormModal open={formOpen} onOpenChange={setFormOpen} homework={editing} />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Student homework view</DialogTitle>
          </DialogHeader>
          {viewing ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{viewing.subject}</p>
                <h3 className="font-display text-lg font-semibold">{viewing.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{viewing.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Assigned {formatDate(viewing.assignedOn)}</span>
                  <span>Due {formatDate(viewing.dueDate)}</span>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Students in this batch
                </p>
                <ul className="max-h-56 space-y-2 overflow-y-auto">
                  {detailStudents.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                      <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold">
                        {initials(s.name)}
                      </span>
                      <span className="flex-1 text-sm font-medium">{s.name}</span>
                      <StatusBadge status={s.submissionStatus ?? "pending"} />
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                className="w-full"
                loading={shareHomework.isPending}
                onClick={() =>
                  shareHomework.mutate(viewing.id, {
                    onSuccess: () => toast.success("Shared with parents"),
                  })
                }
              >
                {shareHomework.isPending ? "Sharing…" : "Share with parents"}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this homework?"
        description={toDelete?.title}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        destructive
        pending={deleteHomework.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteHomework.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Homework deleted");
              setToDelete(null);
            },
          });
        }}
      />
    </AppShell>
  );
}

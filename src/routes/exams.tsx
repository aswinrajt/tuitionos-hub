import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, BookOpen, ClipboardCheck, Plus, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormModal, Field } from "@/components/common/FormModal";
import { PageSkeleton } from "@/components/common/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  type ExamRow,
  useBatches,
  useCreateExam,
  useDeleteExam,
  useExams,
  useSaveExamMarks,
  useSettings,
} from "@/hooks/api";
import { TODAY, formatDate, initials, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Exams & results — TuitionOS" },
      {
        name: "description",
        content: "Create exams, enter marks, see class averages and share student result cards.",
      },
      { property: "og:title", content: "Exams & results — TuitionOS" },
      { property: "og:description", content: "Enter marks and review class performance instantly." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { data: batches = [] } = useBatches();
  const { data: settings } = useSettings();
  const { data, isLoading } = useExams();
  const exams = data ?? [];
  const createExam = useCreateExam();
  const saveExamMarks = useSaveExamMarks();
  const deleteExam = useDeleteExam();
  const [createOpen, setCreateOpen] = useState(false);
  const [marksFor, setMarksFor] = useState<ExamRow | null>(null);
  const [toDelete, setToDelete] = useState<ExamRow | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    batchId: "",
    subject: "Mathematics",
    date: TODAY,
    maxMarks: 50,
  });
  const [marks, setMarks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!marksFor) return;
    const next: Record<string, string> = {};
    marksFor.results.forEach((r) => {
      next[r.studentId] = r.marks === null || r.marks === undefined ? "" : String(r.marks);
    });
    setMarks(next);
  }, [marksFor]);

  const selected = exams.find((e) => e.id === selectedId) ?? exams[0];
  const stats = selected?.stats;
  const chartData = selected
    ? selected.results.map((r) => ({
        name: r.studentName.split(" ")[0] ?? "—",
        marks: r.marks ?? 0,
        percent: r.percent,
      }))
    : [];

  const openCreate = () => {
    setDraft({
      name: "",
      batchId: batches[0]?.id ?? "",
      subject: batches[0]?.subject ?? settings?.subjects[0] ?? "Mathematics",
      date: TODAY,
      maxMarks: 50,
    });
    setCreateOpen(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="Exams & results"
        description="Record tests, enter marks and track class performance."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Create exam
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Exams recorded" value={exams.length} icon={BookOpen} />
        <StatCard label="Class average" value={stats ? pct(stats.averagePct) : "—"} hint={selected?.name} icon={TrendingUp} tone="info" />
        <StatCard label="Highest score" value={stats ? `${stats.highest}/${selected?.maxMarks ?? 0}` : "—"} icon={Award} tone="accent" />
        <StatCard label="Pass rate" value={stats ? pct(stats.passRate) : "—"} hint="35% and above" icon={ClipboardCheck} tone="success" />
      </div>

      {isLoading ? (
        <PageSkeleton cards={0} tiles={3} />
      ) : exams.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {exams.map((e) => {
              const s = e.stats;
              return (
                <div
                  key={e.id}
                  className={cn(
                    "surface-card cursor-pointer p-5 transition-all hover:-translate-y-0.5",
                    selected?.id === e.id && "ring-2 ring-primary",
                  )}
                  onClick={() => setSelectedId(e.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{e.subject}</p>
                      <h3 className="font-display text-base font-semibold">{e.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {e.batchName} · {formatDate(e.date)} · max {e.maxMarks}
                      </p>
                    </div>
                    <span className="font-display text-lg font-semibold">{pct(s.averagePct)}</span>
                  </div>
                  <Progress value={s.averagePct} className="mt-4" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Average {s.average.toFixed(1)}/{e.maxMarks} · {s.count} students graded
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setMarksFor(e);
                      }}
                    >
                      Enter marks
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setToDelete(e);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && stats ? (
            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard
                title={`${selected.name} — score distribution`}
                description={`Class average ${pct(stats.averagePct)} · highest ${stats.highest}, lowest ${stats.lowest}`}
                className="lg:col-span-2"
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-30} height={50} textAnchor="end" />
                      <YAxis domain={[0, selected.maxMarks]} fontSize={12} tickLine={false} axisLine={false} width={32} />
                      <Tooltip
                        formatter={(v) => `${v} / ${selected.maxMarks}`}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-card)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="marks" radius={[6, 6, 0, 0]} maxBarSize={38}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={d.percent >= 60 ? "var(--color-chart-3)" : d.percent >= 35 ? "var(--color-chart-2)" : "var(--color-chart-5)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Result cards" description="Sorted by score" bodyClassName="p-0">
                <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto">
                  {selected.results
                    .slice()
                    .sort((a, b) => (b.marks ?? 0) - (a.marks ?? 0))
                    .map((r) => (
                      <li key={r.studentId} className="flex items-center gap-3 px-4 py-3">
                        <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                          {initials(r.studentName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.studentName}</p>
                          <p className="text-xs text-muted-foreground">Rank #{r.rank} · {pct(r.percent)}</p>
                        </div>
                        <span className="font-display text-sm font-semibold">
                          {r.marks ?? "—"}/{selected.maxMarks}
                        </span>
                      </li>
                    ))}
                </ul>
              </SectionCard>
            </div>
          ) : null}
        </>
      ) : (
        <SectionCard bodyClassName="p-0">
          <EmptyState
            icon={BookOpen}
            title="No exams yet"
            description="Create your first exam and enter marks to see class performance."
            action={<Button size="sm" onClick={openCreate}>Create exam</Button>}
          />
        </SectionCard>
      )}

      <FormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create exam"
        description="Set up a test for a batch, then enter marks."
        submitLabel="Create exam"
        pending={createExam.isPending}
        pendingLabel="Creating exam…"
        onSubmit={() => {
          if (!draft.name.trim()) {
            toast.error("Exam name is required");
            return;
          }
          if (!draft.batchId) {
            toast.error("Select a batch");
            return;
          }
          createExam.mutate(
            {
              name: draft.name,
              batchId: draft.batchId,
              subject: draft.subject,
              date: draft.date,
              maxMarks: draft.maxMarks,
            },
            {
              onSuccess: (exam) => {
                setSelectedId(exam.id);
                setCreateOpen(false);
                setMarksFor(exam);
                toast.success("Exam created — enter marks now");
              },
            },
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Exam name" className="sm:col-span-2">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Monthly Test - September" />
          </Field>
          <Field label="Batch">
            <Select
              value={draft.batchId || undefined}
              onValueChange={(v) => {
                const b = batches.find((x) => x.id === v);
                setDraft({ ...draft, batchId: v, subject: b?.subject ?? draft.subject });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={draft.subject} onValueChange={(v) => setDraft({ ...draft, subject: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(settings?.subjects ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Exam date">
            <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
          <Field label="Maximum marks">
            <Input type="number" value={draft.maxMarks} onChange={(e) => setDraft({ ...draft, maxMarks: Number(e.target.value) })} />
          </Field>
        </div>
      </FormModal>

      <Dialog
        open={!!marksFor}
        onOpenChange={(o) => {
          if (!saveExamMarks.isPending && !o) setMarksFor(null);
        }}
      >
        <DialogContent
          showClose={!saveExamMarks.isPending}
          className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          onPointerDownOutside={(e) => saveExamMarks.isPending && e.preventDefault()}
          onEscapeKeyDown={(e) => saveExamMarks.isPending && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Enter marks — {marksFor?.name}</DialogTitle>
          </DialogHeader>
          {marksFor ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Maximum marks: {marksFor.maxMarks}. Percentage is calculated automatically.
              </p>
              <ul className="space-y-2">
                {marksFor.results.map((r) => {
                  const value = marks[r.studentId] ?? "";
                  const percent = value ? (Number(value) / marksFor.maxMarks) * 100 : null;
                  return (
                    <li key={r.studentId} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                      <span className="flex-1 text-sm font-medium">{r.studentName}</span>
                      <span className="w-14 text-right text-xs text-muted-foreground">
                        {percent === null ? "—" : pct(percent)}
                      </span>
                      <Input
                        type="number"
                        className="w-20"
                        max={marksFor.maxMarks}
                        value={value}
                        onChange={(e) => setMarks({ ...marks, [r.studentId]: e.target.value })}
                      />
                    </li>
                  );
                })}
              </ul>
              <DialogFooter>
                <Button variant="outline" disabled={saveExamMarks.isPending} onClick={() => setMarksFor(null)}>Cancel</Button>
                <Button
                  loading={saveExamMarks.isPending}
                  onClick={() => {
                    saveExamMarks.mutate(
                      {
                        id: marksFor.id,
                        results: Object.entries(marks).map(([studentId, v]) => ({
                          studentId,
                          marks: v === "" ? null : Number(v),
                        })),
                      },
                      {
                        onSuccess: () => {
                          toast.success("Marks saved");
                          setMarksFor(null);
                        },
                      },
                    );
                  }}
                >
                  {saveExamMarks.isPending ? "Saving marks…" : "Save marks"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this exam?"
        description={`${toDelete?.name} and all recorded marks will be removed.`}
        confirmLabel="Delete exam"
        pendingLabel="Deleting…"
        destructive
        pending={deleteExam.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteExam.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success("Exam deleted");
              setToDelete(null);
            },
          });
        }}
      />
    </AppShell>
  );
}

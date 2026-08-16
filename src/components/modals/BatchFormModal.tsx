import { useEffect, useState } from "react";
import { FormModal, Field } from "@/components/common/FormModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/tuition-store";
import { WEEKDAYS } from "@/data/mock";
import type { Batch } from "@/data/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function BatchFormModal({
  open,
  onOpenChange,
  batch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: Batch;
}) {
  const { teachers, settings, addBatch, updateBatch } = useStore();
  const blank = {
    name: "",
    className: settings.classes[4] ?? "Class 10",
    subject: settings.subjects[0] ?? "Mathematics",
    teacherId: teachers[0]?.id ?? "",
    days: ["Mon", "Wed", "Fri"] as string[],
    startTime: "17:00",
    endTime: "18:30",
    room: "Room 1",
    status: "active" as const,
  };
  const [draft, setDraft] = useState<Omit<Batch, "id">>(blank);

  useEffect(() => {
    if (open) setDraft(batch ? { ...batch } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batch]);

  const toggleDay = (day: string) =>
    setDraft((d) => ({
      ...d,
      days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day],
    }));

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      wide
      title={batch ? "Edit batch" : "Create batch"}
      description="A batch groups students by class, subject, teacher and schedule."
      submitLabel={batch ? "Save changes" : "Create batch"}
      onSubmit={() => {
        if (!draft.name.trim()) {
          toast.error("Batch name is required");
          return;
        }
        if (!draft.days.length) {
          toast.error("Select at least one class day");
          return;
        }
        if (batch) {
          updateBatch(batch.id, draft);
          toast.success(`${draft.name} updated`);
        } else {
          addBatch(draft);
          toast.success(`${draft.name} created`);
        }
        onOpenChange(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Batch name" className="sm:col-span-2">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="X-A Maths Morning" />
        </Field>
        <Field label="Class">
          <Select value={draft.className} onValueChange={(v) => setDraft({ ...draft, className: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {settings.classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Subject">
          <Select value={draft.subject} onValueChange={(v) => setDraft({ ...draft, subject: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {settings.subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Teacher">
          <Select value={draft.teacherId} onValueChange={(v) => setDraft({ ...draft, teacherId: v })}>
            <SelectTrigger><SelectValue placeholder="Assign teacher" /></SelectTrigger>
            <SelectContent>
              {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Room">
          <Input value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} />
        </Field>
        <Field label="Start time">
          <Input type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
        </Field>
        <Field label="End time">
          <Input type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
        </Field>
        <Field label="Class days" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  draft.days.includes(d)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </FormModal>
  );
}

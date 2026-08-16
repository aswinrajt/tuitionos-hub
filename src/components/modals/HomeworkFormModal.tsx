import { useEffect, useState } from "react";
import { FormModal, Field } from "@/components/common/FormModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/tuition-store";
import { TODAY, shift } from "@/data/mock";
import type { Homework } from "@/data/types";
import { toast } from "sonner";

export function HomeworkFormModal({
  open,
  onOpenChange,
  homework,
  defaultBatchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homework?: Homework;
  defaultBatchId?: string;
}) {
  const { batches, settings, addHomework, updateHomework } = useStore();
  const blank = {
    batchId: defaultBatchId ?? batches[0]?.id ?? "",
    subject: batches[0]?.subject ?? "Mathematics",
    title: "",
    description: "",
    assignedOn: TODAY,
    dueDate: shift(3),
    status: "pending" as const,
  };
  const [draft, setDraft] = useState<Omit<Homework, "id">>(blank);

  useEffect(() => {
    if (open) setDraft(homework ? { ...homework } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, homework]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={homework ? "Edit homework" : "Add homework"}
      description="Assign work to a batch with a clear due date."
      submitLabel={homework ? "Save changes" : "Assign homework"}
      onSubmit={() => {
        if (!draft.title.trim()) {
          toast.error("Homework title is required");
          return;
        }
        if (homework) {
          updateHomework(homework.id, draft);
          toast.success("Homework updated");
        } else {
          addHomework(draft);
          toast.success("Homework assigned");
        }
        onOpenChange(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Batch">
          <Select
            value={draft.batchId}
            onValueChange={(v) => {
              const b = batches.find((x) => x.id === v);
              setDraft({ ...draft, batchId: v, subject: b?.subject ?? draft.subject });
            }}
          >
            <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
            <SelectContent>
              {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
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
        <Field label="Title" className="sm:col-span-2">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Quadratic Equations - Ex 4.3" />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea
            rows={4}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="What should the students complete?"
          />
        </Field>
        <Field label="Assigned on">
          <Input type="date" value={draft.assignedOn} onChange={(e) => setDraft({ ...draft, assignedOn: e.target.value })} />
        </Field>
        <Field label="Due date">
          <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
        </Field>
      </div>
    </FormModal>
  );
}

import { useEffect, useState } from "react";
import { FormModal, Field } from "@/components/common/FormModal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/tuition-store";
import { TODAY } from "@/data/mock";
import type { Student } from "@/data/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emptyDraft = (batchId: string, className: string) => ({
  name: "",
  phone: "",
  parentName: "",
  parentPhone: "",
  className,
  batchId,
  subjects: [] as string[],
  joiningDate: TODAY,
  monthlyFee: 1500,
  status: "active" as const,
  gender: "Male" as const,
  address: "",
});

export function StudentFormModal({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
}) {
  const { batches, settings, addStudent, updateStudent } = useStore();
  const [draft, setDraft] = useState<Omit<Student, "id">>(() => emptyDraft(batches[0]?.id ?? "", settings.classes[4] ?? "Class 10"));

  useEffect(() => {
    if (open)
      setDraft(
        student
          ? { ...student }
          : emptyDraft(batches[0]?.id ?? "", settings.classes[4] ?? "Class 10"),
      );
  }, [open, student, batches, settings.classes]);

  const toggleSubject = (subject: string) =>
    setDraft((d) => ({
      ...d,
      subjects: d.subjects.includes(subject)
        ? d.subjects.filter((s) => s !== subject)
        : [...d.subjects, subject],
    }));

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      wide
      title={student ? "Edit student" : "Add student"}
      description={student ? "Update the student record." : "Admit a new student to your centre."}
      submitLabel={student ? "Save changes" : "Add student"}
      onSubmit={() => {
        if (!draft.name.trim()) {
          toast.error("Student name is required");
          return;
        }
        if (student) {
          updateStudent(student.id, draft);
          toast.success(`${draft.name} updated`);
        } else {
          addStudent(draft);
          toast.success(`${draft.name} admitted`);
        }
        onOpenChange(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student name">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Aarav Sharma" />
        </Field>
        <Field label="Student phone">
          <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Parent name">
          <Input value={draft.parentName} onChange={(e) => setDraft({ ...draft, parentName: e.target.value })} placeholder="Suresh Sharma" />
        </Field>
        <Field label="Parent phone">
          <Input value={draft.parentPhone} onChange={(e) => setDraft({ ...draft, parentPhone: e.target.value })} placeholder="+91 98765 00000" />
        </Field>
        <Field label="Class">
          <Select value={draft.className} onValueChange={(v) => setDraft({ ...draft, className: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {settings.classes.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Batch">
          <Select value={draft.batchId} onValueChange={(v) => setDraft({ ...draft, batchId: v })}>
            <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Joining date">
          <Input type="date" value={draft.joiningDate} onChange={(e) => setDraft({ ...draft, joiningDate: e.target.value })} />
        </Field>
        <Field label="Monthly fee (₹)">
          <Input type="number" value={draft.monthlyFee} onChange={(e) => setDraft({ ...draft, monthlyFee: Number(e.target.value) })} />
        </Field>
        <Field label="Gender">
          <Select value={draft.gender} onValueChange={(v) => setDraft({ ...draft, gender: v as Student["gender"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Student["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="12, Indiranagar" />
        </Field>
        <Field label="Subjects" className="sm:col-span-2" hint="Tap to select the subjects this student attends">
          <div className="flex flex-wrap gap-2">
            {settings.subjects.map((s) => (
              <Badge
                key={s}
                onClick={() => toggleSubject(s)}
                className={cn(
                  "cursor-pointer border px-2.5 py-1 text-xs font-medium transition-colors",
                  draft.subjects.includes(s)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {s}
              </Badge>
            ))}
          </div>
        </Field>
      </div>
    </FormModal>
  );
}

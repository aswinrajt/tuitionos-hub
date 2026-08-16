import { useEffect, useState } from "react";
import { FormModal, Field } from "@/components/common/FormModal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/tuition-store";
import { CURRENT_MONTH, TODAY, monthOffset } from "@/data/mock";
import { formatMonth, inr } from "@/lib/format";
import type { FeePayment } from "@/data/types";
import { toast } from "sonner";

const months = [monthOffset(-2), monthOffset(-1), CURRENT_MONTH, monthOffset(1)];

export function RecordPaymentModal({
  open,
  onOpenChange,
  studentId,
  month,
  onRecorded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string;
  month?: string;
  onRecorded?: (payment: FeePayment) => void;
}) {
  const { students, recordPayment } = useStore();
  const active = students.filter((s) => s.status === "active");
  const [draft, setDraft] = useState({
    studentId: studentId ?? active[0]?.id ?? "",
    month: month ?? CURRENT_MONTH,
    amount: 0,
    method: "UPI" as FeePayment["method"],
    paidOn: TODAY,
    note: "",
  });

  useEffect(() => {
    if (!open) return;
    const id = studentId ?? active[0]?.id ?? "";
    const student = students.find((s) => s.id === id);
    setDraft({
      studentId: id,
      month: month ?? CURRENT_MONTH,
      amount: student?.monthlyFee ?? 0,
      method: "UPI",
      paidOn: TODAY,
      note: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId, month]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Record fee payment"
      description="Log a payment and generate a receipt instantly."
      submitLabel="Record payment"
      onSubmit={() => {
        if (!draft.studentId) {
          toast.error("Select a student");
          return;
        }
        if (draft.amount <= 0) {
          toast.error("Enter a valid amount");
          return;
        }
        const payment = recordPayment(draft);
        toast.success(`Payment of ${inr(draft.amount)} recorded`);
        onOpenChange(false);
        onRecorded?.(payment);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student" className="sm:col-span-2">
          <Select
            value={draft.studentId}
            onValueChange={(v) => {
              const s = students.find((x) => x.id === v);
              setDraft({ ...draft, studentId: v, amount: s?.monthlyFee ?? draft.amount });
            }}
          >
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent className="max-h-64">
              {active.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {s.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Fee month">
          <Select value={draft.month} onValueChange={(v) => setDraft({ ...draft, month: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Amount (₹)">
          <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
        </Field>
        <Field label="Payment mode">
          <Select value={draft.method} onValueChange={(v) => setDraft({ ...draft, method: v as FeePayment["method"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["UPI", "Cash", "Bank Transfer", "Cheque"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Paid on">
          <Input type="date" value={draft.paidOn} onChange={(e) => setDraft({ ...draft, paidOn: e.target.value })} />
        </Field>
        <Field label="Note (optional)" className="sm:col-span-2">
          <Textarea rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Paid via GPay, reference 8823" />
        </Field>
      </div>
    </FormModal>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Printer, Share2 } from "lucide-react";
import { useStore } from "@/store/tuition-store";
import { formatDate, formatMonth, inr } from "@/lib/format";
import type { FeePayment } from "@/data/types";
import { toast } from "sonner";

export function ReceiptDialog({
  payment,
  onOpenChange,
}: {
  payment: FeePayment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { students, settings, batches } = useStore();
  const student = students.find((s) => s.id === payment?.studentId);
  const batch = batches.find((b) => b.id === student?.batchId);

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment receipt</DialogTitle>
        </DialogHeader>
        {payment && student ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-success">
              <CheckCircle2 className="size-5" />
              <p className="text-sm font-semibold">Payment recorded successfully</p>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold">{settings.centreName}</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.address}, {settings.city}
                  </p>
                  <p className="text-xs text-muted-foreground">GSTIN: {settings.gstin}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Receipt</p>
                  <p className="font-display text-sm font-semibold">{payment.receiptNo}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(payment.paidOn)}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Student", student.name],
                  ["Class / Batch", `${student.className} · ${batch?.name ?? "—"}`],
                  ["Parent", student.parentName],
                  ["Fee month", formatMonth(payment.month)],
                  ["Payment mode", payment.method],
                  ["Received by", settings.ownerName],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <Separator className="my-4" />
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount paid</p>
                  <p className="font-display text-2xl font-semibold text-primary">{inr(payment.amount)}</p>
                </div>
                <p className="text-xs text-muted-foreground">Computer generated receipt</p>
              </div>
              {payment.note ? (
                <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Note: {payment.note}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" onClick={() => toast.success("Receipt sent to print queue")}>
                <Printer className="mr-2 size-4" /> Print receipt
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => toast.success("Receipt link copied")}>
                <Share2 className="mr-2 size-4" /> Share with parent
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

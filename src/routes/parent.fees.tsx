import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, CheckCircle2, Download, IndianRupee, Smartphone } from "lucide-react";
import {
  ParentCard,
  ParentEmpty,
  ParentPageTitle,
  ParentScreenLoading,
  ParentShell,
  useParentContext,
} from "@/components/parent/ParentShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useParentAuth } from "@/store/parent-auth";
import {
  useParentFees,
  useParentPayAtCentre,
  useParentPayUpi,
  type ParentFeePayment,
} from "@/hooks/api";
import { CURRENT_MONTH, formatDate, formatMonth, inr } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/fees")({
  head: () => ({
    meta: [
      { title: "Fees — TuitionOS Parent Portal" },
      { name: "description", content: "Check this month's fee status, view past payment receipts and see exactly what is pending." },
      { property: "og:title", content: "Fees — TuitionOS Parent Portal" },
      { property: "og:description", content: "Fee status, receipts and dues in plain language." },
    ],
  }),
  component: ParentFeesPage,
});

function ParentFeesPage() {
  const { activeChildId } = useParentAuth();
  const { child } = useParentContext();
  const studentId = child?.id ?? activeChildId;
  const { data, isLoading } = useParentFees(studentId);
  const payUpi = useParentPayUpi();
  const payCash = useParentPayAtCentre();
  const [receipt, setReceipt] = useState<ParentFeePayment | null>(null);

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

  const current = data.current;
  const isPaid = current.status === "paid";
  const month = current.month || CURRENT_MONTH;

  return (
    <ParentShell>
      <ParentPageTitle title="Fees" description={`Fee details for ${data.childName}.`} />

      <ParentCard className={isPaid ? "border-primary/40 bg-primary-soft/40" : "border-destructive/40"}>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{formatMonth(month)}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="font-display text-3xl font-semibold">{inr(data.monthlyFee)}</p>
          <Badge variant={isPaid ? "default" : current.status === "overdue" ? "destructive" : "secondary"} className="capitalize">
            {current.status}
          </Badge>
        </div>
        {isPaid && current.payment ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-primary">
            <CheckCircle2 className="size-4" /> Paid on {formatDate(current.payment.paidOn)} via {current.payment.method}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Due on {formatDate(current.dueDate)}. A late fee of {inr(data.lateFeeAmount)} may apply after the due date.
          </p>
        )}

        {isPaid && current.payment ? (
          <Button variant="outline" className="mt-4 h-11 w-full" onClick={() => setReceipt(current.payment)}>
            <Download className="mr-2 size-4" /> View receipt
          </Button>
        ) : (
          <div className="mt-4 grid gap-2">
            <Button
              className="h-12 text-base"
              loading={payUpi.isPending}
              disabled={payCash.isPending}
              onClick={() =>
                payUpi.mutate(
                  { studentId, month },
                  { onSuccess: (res) => toast.success(res.message) },
                )
              }
            >
              <Smartphone className="mr-2 size-4" /> {payUpi.isPending ? "Starting UPI…" : `Pay ${inr(data.monthlyFee)} by UPI`}
            </Button>
            <Button
              variant="outline"
              className="h-11"
              loading={payCash.isPending}
              disabled={payUpi.isPending}
              onClick={() =>
                payCash.mutate(
                  { studentId, month },
                  { onSuccess: (res) => toast.success(res.message) },
                )
              }
            >
              <Banknote className="mr-2 size-4" /> {payCash.isPending ? "Notifying centre…" : "I will pay at the centre"}
            </Button>
          </div>
        )}
      </ParentCard>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Paid (last 6 months)</p>
          <p className="mt-1 font-display text-xl font-semibold">{inr(data.paidTotal)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="mt-1 font-display text-xl font-semibold">{inr(data.pendingTotal)}</p>
          <p className="text-xs text-muted-foreground">{data.pendingMonths} month(s)</p>
        </div>
      </div>

      <ParentCard title="Payment history">
        <ul className="divide-y divide-border">
          {data.ledger.map((row) => (
            <li key={row.month} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{formatMonth(row.month)}</p>
                <p className="text-xs text-muted-foreground">
                  {row.payment
                    ? `Paid ${formatDate(row.payment.paidOn)} · ${row.payment.method} · ${row.payment.receiptNo}`
                    : `Due ${formatDate(row.dueDate)}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{inr(row.payment?.amount ?? data.monthlyFee)}</p>
                {row.payment ? (
                  <button className="text-xs font-medium text-primary" onClick={() => setReceipt(row.payment)}>
                    Receipt
                  </button>
                ) : (
                  <Badge variant={row.status === "overdue" ? "destructive" : "secondary"} className="mt-0.5 capitalize">
                    {row.status}
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </ParentCard>

      <ParentCard title="Need help?">
        <p className="text-sm text-muted-foreground">
          For any fee question, call the centre office at {data.centrePhone}. Receipts are
          issued by the centre and appear here automatically.
        </p>
      </ParentCard>

      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment receipt</DialogTitle>
            <DialogDescription>{receipt?.receiptNo}</DialogDescription>
          </DialogHeader>
          {receipt ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="font-display text-base font-semibold">{data.centreName}</p>
                <p className="text-xs text-muted-foreground">{data.centreAddress}, {data.centreCity}</p>
              </div>
              <Line label="Student" value={data.childName} />
              <Line label="Class / batch" value={data.className} />
              <Line label="Month" value={formatMonth(receipt.month)} />
              <Line label="Paid on" value={formatDate(receipt.paidOn)} />
              <Line label="Method" value={receipt.method} />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-medium">Amount paid</span>
                <span className="flex items-center font-display text-lg font-semibold">
                  <IndianRupee className="size-4" />
                  {receipt.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <Button className="h-11 w-full" onClick={() => window.print()}>
                <Download className="mr-2 size-4" /> Save / print receipt
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </ParentShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

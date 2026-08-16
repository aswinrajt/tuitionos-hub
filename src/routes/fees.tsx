import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, BellRing, Plus, Receipt, Search, TrendingUp, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { ReceiptDialog } from "@/components/modals/ReceiptDialog";
import { useStore } from "@/store/tuition-store";
import { CURRENT_MONTH, monthOffset } from "@/data/mock";
import { feeSummary, studentFeeStatus } from "@/lib/selectors";
import { formatDate, formatMonth, inr, initials, pct } from "@/lib/format";
import type { FeePayment, Student } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/fees")({
  head: () => ({
    meta: [
      { title: "Fees — TuitionOS" },
      {
        name: "description",
        content: "Monthly fee dashboard with collected, pending and overdue amounts plus receipts.",
      },
      { property: "og:title", content: "Fees — TuitionOS" },
      { property: "og:description", content: "Track collections, record payments and print receipts." },
    ],
  }),
  component: FeesPage,
});

const monthOptions = [monthOffset(-3), monthOffset(-2), monthOffset(-1), CURRENT_MONTH];

function FeesPage() {
  const store = useStore();
  const navigate = useNavigate();
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [payFor, setPayFor] = useState<Student | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);

  const active = store.students.filter((s) => s.status === "active");
  const summary = feeSummary(active, store.feePayments, month, store.settings.feeDueDay);

  const rows = useMemo(
    () =>
      active
        .map((s) => ({
          ...s,
          feeStatus: studentFeeStatus(store.feePayments, s, month, store.settings.feeDueDay),
          payment: store.feePayments.find((p) => p.studentId === s.id && p.month === month),
        }))
        .filter((s) => (status === "all" || s.feeStatus === status) && s.name.toLowerCase().includes(query.trim().toLowerCase())),
    [active, store.feePayments, month, status, query, store.settings.feeDueDay],
  );

  const pieData = [
    { name: "Collected", value: summary.collected },
    { name: "Pending", value: summary.pending },
  ];

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "student",
      header: "Student",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            {initials(s.name)}
          </span>
          <div>
            <p className="font-medium">{s.name}</p>
            <p className="text-xs text-muted-foreground">{s.className} · {s.parentPhone}</p>
          </div>
        </div>
      ),
    },
    { key: "batch", header: "Batch", cell: (s) => store.batches.find((b) => b.id === s.batchId)?.name ?? "—" },
    { key: "amount", header: "Fee", cell: (s) => inr(s.monthlyFee) },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.feeStatus} /> },
    {
      key: "paid",
      header: "Payment",
      cell: (s) =>
        s.payment ? (
          <div>
            <p className="text-xs font-medium">{s.payment.method}</p>
            <p className="text-xs text-muted-foreground">{formatDate(s.payment.paidOn)}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not received</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (s) =>
        s.payment ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setReceipt(s.payment!);
            }}
          >
            <Receipt className="mr-2 size-4" /> Receipt
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setPayFor(s);
              setPayOpen(true);
            }}
          >
            Record
          </Button>
        ),
    },
  ];

  const recent = store.feePayments
    .slice()
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn))
    .slice(0, 8);

  return (
    <AppShell>
      <PageHeader
        title="Fees"
        description={`${formatMonth(month)} · ${summary.paidCount} of ${active.length} students paid`}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success(`Reminder sent to ${summary.overdueCount} parents`)}>
              <BellRing className="mr-2 size-4" /> Send reminders
            </Button>
            <Button
              onClick={() => {
                setPayFor(null);
                setPayOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" /> Record payment
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total expected" value={inr(summary.expected, { compact: true })} hint={`${active.length} active students`} icon={TrendingUp} />
        <StatCard label="Collected" value={inr(summary.collected, { compact: true })} hint={pct(summary.collectionRate) + " of expected"} icon={Wallet} tone="success" />
        <StatCard label="Pending" value={inr(summary.pending, { compact: true })} hint={`${active.length - summary.paidCount} students`} icon={Receipt} tone="warning" />
        <StatCard label="Overdue" value={summary.overdueCount} hint={`Due day ${store.settings.feeDueDay} of month`} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="Collection progress" description={formatMonth(month)} className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="font-display text-3xl font-semibold text-primary">{inr(summary.collected)}</p>
              <p className="text-sm text-muted-foreground">of {inr(summary.expected)} expected</p>
            </div>
            <Progress value={summary.collectionRate} className="h-3" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Paid", summary.paidCount, "text-success"],
                ["Pending", active.length - summary.paidCount - summary.overdueCount, "text-warning-foreground"],
                ["Overdue", summary.overdueCount, "text-destructive"],
              ].map(([label, value, tone]) => (
                <div key={label as string} className="rounded-xl border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{label as string}</p>
                  <p className={`font-display text-xl font-semibold ${tone as string}`}>
                    {Math.max(0, Number(value))} students
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Collected vs pending">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={48} outerRadius={74} paddingAngle={3}>
                  <Cell fill="var(--color-chart-1)" />
                  <Cell fill="var(--color-chart-2)" />
                </Pie>
                <Tooltip
                  formatter={(v) => inr(Number(v))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-chart-1" /> Collected</span>
              <span className="font-semibold">{inr(summary.collected)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-chart-2" /> Pending</span>
              <span className="font-semibold">{inr(summary.pending)}</span>
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard bodyClassName="p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student" className="pl-9" />
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <SectionCard title="Student fee table" description={`${rows.length} students`} bodyClassName="p-0">
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(s) => navigate({ to: "/students/$studentId", params: { studentId: s.id } })}
          empty={<EmptyState icon={Wallet} title="No students match these filters" description="Change the month or status filter to see fee records." />}
        />
      </SectionCard>

      <SectionCard title="Payment history" description="Most recent receipts" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {recent.map((p) => {
            const student = store.students.find((s) => s.id === p.studentId);
            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-9 place-items-center rounded-full bg-success-soft text-xs font-bold text-success">
                  {initials(student?.name ?? "?")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{student?.name ?? "Unknown student"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.receiptNo} · {formatMonth(p.month)} · {p.method}
                  </p>
                </div>
                <span className="font-semibold">{inr(p.amount)}</span>
                <Button variant="ghost" size="sm" onClick={() => setReceipt(p)}>
                  View
                </Button>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <RecordPaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        studentId={payFor?.id}
        month={month}
        onRecorded={setReceipt}
      />
      <ReceiptDialog payment={receipt} onOpenChange={() => setReceipt(null)} />
    </AppShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MoreVertical, Pencil, Plus, Search, Trash2, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { ReceiptDialog } from "@/components/modals/ReceiptDialog";
import { useBatches, useDeleteStudent, useSettings, useStudents, type StudentRow } from "@/hooks/api";
import { inr, initials, pct } from "@/lib/format";
import type { FeePayment, Student } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Students — TuitionOS" },
      {
        name: "description",
        content: "Search, filter and manage every student enrolled at your tuition centre.",
      },
      { property: "og:title", content: "Students — TuitionOS" },
      { property: "og:description", content: "Manage student admissions, batches and fee status." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | undefined>();
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [payFor, setPayFor] = useState<Student | null>(null);
  const [receipt, setReceipt] = useState<FeePayment | null>(null);

  const filters = {
    ...(query.trim() ? { q: query.trim() } : {}),
    ...(classFilter !== "all" ? { className: classFilter } : {}),
    ...(batchFilter !== "all" ? { batchId: batchFilter } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const { data: allStudents = [] } = useStudents();
  const { data: rows = [], isLoading } = useStudents(filters);
  const { data: batches = [] } = useBatches();
  const { data: settings } = useSettings();
  const deleteStudent = useDeleteStudent();
  const classes = settings?.classes ?? [];

  const columns: Column<StudentRow>[] = [
    {
      key: "name",
      header: "Student",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            {initials(s.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{s.name}</p>
            <p className="truncate text-xs text-muted-foreground">{s.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      cell: (s) => (
        <div>
          <p className="font-medium">{s.parentName}</p>
          <p className="text-xs text-muted-foreground">{s.parentPhone}</p>
        </div>
      ),
    },
    { key: "class", header: "Class", cell: (s) => s.className },
    {
      key: "batch",
      header: "Batch",
      cell: (s) => s.batchName ?? "—",
    },
    {
      key: "attendance",
      header: "Attendance",
      cell: (s) => {
        const value = s.attendancePercent;
        return (
          <span className={value >= 75 ? "font-semibold text-success" : "font-semibold text-warning-foreground"}>
            {value ? pct(value) : "—"}
          </span>
        );
      },
    },
    { key: "fee", header: "Monthly fee", cell: (s) => inr(s.monthlyFee) },
    {
      key: "feeStatus",
      header: "Fee status",
      cell: (s) => <StatusBadge status={s.feeStatus} />,
    },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} aria-label="Student actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => navigate({ to: "/students/$studentId", params: { studentId: s.id } })}>
              View profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setEditing(s);
                setFormOpen(true);
              }}
            >
              <Pencil className="mr-2 size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPayFor(s)}>
              <Wallet className="mr-2 size-4" /> Record fee
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setToDelete(s)}>
              <Trash2 className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Students"
        description={`${allStudents.length} students enrolled · ${allStudents.filter((s) => s.status === "active").length} active`}
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Add student
          </Button>
        }
      />

      <SectionCard bodyClassName="p-4 sm:p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student or parent"
              className="pl-9"
            />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <SectionCard
        title={`${rows.length} student${rows.length === 1 ? "" : "s"}`}
        description="Tap a row to open the full profile"
        bodyClassName="p-0"
      >
        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          onRowClick={(s) => navigate({ to: "/students/$studentId", params: { studentId: s.id } })}
          empty={
            <EmptyState
              icon={Users}
              title="No students match your filters"
              description="Try clearing the search or filters, or admit a new student."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setClassFilter("all");
                    setBatchFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          }
        />
      </SectionCard>

      <StudentFormModal open={formOpen} onOpenChange={setFormOpen} student={editing} />
      <RecordPaymentModal
        open={!!payFor}
        onOpenChange={(o) => !o && setPayFor(null)}
        studentId={payFor?.id}
        onRecorded={setReceipt}
      />
      <ReceiptDialog payment={receipt} onOpenChange={() => setReceipt(null)} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="This removes the student record along with their fee and attendance history from this view."
        confirmLabel="Delete student"
        pendingLabel="Deleting…"
        destructive
        pending={deleteStudent.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          const name = toDelete.name;
          deleteStudent.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(`${name} deleted`);
              setToDelete(null);
            },
          });
        }}
      />
    </AppShell>
  );
}

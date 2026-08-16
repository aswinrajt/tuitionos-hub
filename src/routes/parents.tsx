import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, ClipboardList, ExternalLink, Megaphone, MessageSquare, Send, Smartphone, Trash2, UserRound, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnnouncements,
  useBatches,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useInviteParent,
  useParentPreview,
  useParents,
  useStudents,
} from "@/hooks/api";
import { CURRENT_MONTH, formatDate, initials, inr, pct } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/parents")({
  head: () => ({
    meta: [
      { title: "Parent portal preview — TuitionOS" },
      {
        name: "description",
        content: "Preview the parent view: attendance, fee status, homework and results for each student.",
      },
      { property: "og:title", content: "Parent portal preview — TuitionOS" },
      { property: "og:description", content: "See exactly what parents see before you share updates." },
    ],
  }),
  component: ParentsPage,
});

type ParentPreview = {
  student: { id: string; name: string; className: string; monthlyFee: number; parentName: string };
  batchName: string;
  teacherName: string;
  teacherPhone: string;
  attendancePercent: number;
  feePaid: boolean;
  homework: { id: string; title: string; subject: string; dueDate: string; status: "pending" | "completed" }[];
  results: { examId: string; name: string; marks: number | null; maxMarks: number; classAvg: number }[];
};

function ParentsPage() {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: parents = [] } = useParents();
  const [studentId, setStudentId] = useState("");
  const inviteParent = useInviteParent();

  useEffect(() => {
    if (students.length === 0) return;
    if (!studentId || !students.some((s) => s.id === studentId)) {
      setStudentId(students[0]!.id);
    }
  }, [students, studentId]);

  const { data: previewData } = useParentPreview(studentId);
  const preview = previewData as ParentPreview | undefined;
  const student = students.find((s) => s.id === studentId) ?? students[0];
  const parentAccount = parents.find(
    (p) => p.studentIds.includes(studentId) || p.students.some((s) => s.id === studentId),
  );

  if (studentsLoading && !student) {
    return (
      <AppShell>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </AppShell>
    );
  }

  if (!student) {
    return (
      <AppShell>
        <PageHeader
          title="Parents"
          description="Preview what a parent sees on their phone, send portal invites, and publish announcements. Add a student first — parent accounts are linked from the student record."
          actions={
            <Button asChild>
              <Link to="/students">Go to students</Link>
            </Button>
          }
        />
        <AnnouncementComposer />
      </AppShell>
    );
  }

  const name = preview?.student.name ?? student.name;
  const className = preview?.student.className ?? student.className;
  const batchName = preview?.batchName ?? student.batchName ?? "No batch";
  const parentName = preview?.student.parentName ?? parentAccount?.name ?? student.parentName;
  const attendance = preview?.attendancePercent ?? 0;
  const monthlyFee = preview?.student.monthlyFee ?? student.monthlyFee;
  const paid = preview?.feePaid ?? false;
  const homework = preview?.homework ?? [];
  const results = preview?.results ?? [];
  const teacherName = preview?.teacherName ?? "—";
  const teacherPhone = preview?.teacherPhone ?? "";

  const sendInvite = () => {
    if (!parentAccount) {
      toast.error("No parent account is linked to this student");
      return;
    }
    inviteParent.mutate(parentAccount.id, {
      onSuccess: () => toast.success("Portal invite sent to parent on WhatsApp"),
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Parents"
        description="Staff preview of the parent phone view for a selected student. Send a portal invite, or publish announcements that appear in every parent's feed. This is not the parent login — that is /parent."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={sendInvite} loading={inviteParent.isPending}>
              <MessageSquare className="mr-2 size-4" /> {inviteParent.isPending ? "Sending…" : "Send invite"}
            </Button>
            <Button asChild>
              <Link to="/parent/login" target="_blank">
                <ExternalLink className="mr-2 size-4" /> Open parent portal
              </Link>
            </Button>
          </div>
        }
      />

      <SectionCard bodyClassName="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} — {s.className}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Smartphone className="size-4" /> Previewing as {parentName}
          </p>
        </div>
      </SectionCard>

      <div className="mx-auto w-full max-w-sm">
        <div className="rounded-[2rem] border-8 border-foreground/90 bg-background p-4 shadow-float">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-foreground/20" />
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-3">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initials(name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {className} · {batchName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarCheck className="size-3.5" /> Attendance
                </p>
                <p className="mt-1 font-display text-xl font-semibold">{pct(attendance)}</p>
                <Progress value={attendance} className="mt-2" />
              </div>
              <div className="rounded-2xl border border-border p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="size-3.5" /> Fees {formatDate(`${CURRENT_MONTH}-01`).slice(3)}
                </p>
                <p className="mt-1 font-display text-xl font-semibold">{inr(monthlyFee)}</p>
                <div className="mt-2"><StatusBadge status={paid ? "paid" : "pending"} /></div>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ClipboardList className="size-3.5" /> Homework
              </p>
              <ul className="space-y-2">
                {homework.length ? (
                  homework.map((h) => (
                    <li key={h.id} className="rounded-xl border border-border p-2.5">
                      <p className="text-sm font-medium">{h.title}</p>
                      <p className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{h.subject} · due {formatDate(String(h.dueDate).slice(0, 10))}</span>
                        <StatusBadge status={h.status} />
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">No homework assigned.</li>
                )}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent results
              </p>
              <ul className="space-y-2">
                {results.length ? (
                  results.map((result) => (
                    <li key={result.examId} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{result.name}</span>
                        <span className="text-xs text-muted-foreground">
                          class avg {pct(result.classAvg)}
                        </span>
                      </span>
                      <span className="font-display font-semibold">
                        {result.marks}/{result.maxMarks}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">No results published yet.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <UserRound className="size-3.5" /> Class teacher
              </p>
              <p className="mt-1">{teacherName} · {teacherPhone}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Parents sign in at /parent with their registered mobile number and OTP.
        </p>
      </div>

      <AnnouncementComposer />
    </AppShell>
  );
}

function AnnouncementComposer() {
  const { data: announcements = [] } = useAnnouncements();
  const { data: batches = [] } = useBatches();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  return (
    <SectionCard
      title="Announcements to parents"
      description="Published notices show up in every parent's notification feed."
      bodyClassName="p-4 space-y-4"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="an-title">Title</Label>
            <Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diwali holiday notice" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-body">Message</Label>
            <Textarea id="an-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="The centre will remain closed on 20 Oct." />
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All parents</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!title.trim() || !body.trim()}
            loading={createAnnouncement.isPending}
            onClick={() => {
              createAnnouncement.mutate(
                { title: title.trim(), body: body.trim(), audience, pinned: false },
                {
                  onSuccess: () => {
                    setTitle("");
                    setBody("");
                    toast.success("Announcement published to the parent portal");
                  },
                },
              );
            }}
          >
            <Send className="mr-2 size-4" /> {createAnnouncement.isPending ? "Publishing…" : "Publish to parents"}
          </Button>
        </div>

        <ul className="space-y-2">
          {announcements.slice(0, 5).map((a) => (
            <li key={a.id} className="rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Megaphone className="size-3.5 text-primary" /> {a.title}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    disabled={deleteAnnouncement.isPending}
                    loading={deleteAnnouncement.isPending}
                    onClick={() =>
                      deleteAnnouncement.mutate(a.id, {
                        onSuccess: () => toast.success("Announcement removed"),
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                To {a.audience === "all" ? "all parents" : batches.find((b) => b.id === a.audience)?.name ?? a.audience}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

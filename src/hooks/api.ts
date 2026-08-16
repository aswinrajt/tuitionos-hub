import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toastError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type {
  Announcement,
  Batch,
  CentreSettings,
  Exam,
  FeePayment,
  Homework,
  ParentAccount,
  Student,
  Teacher,
} from "@/data/types";

export type TeacherRow = Teacher & {
  batches: { id: string; name: string; startTime: string }[];
  studentCount: number;
};

export type BatchRow = Batch & {
  teacherName: string;
  studentCount: number;
  attendancePercent: number;
  monthlyRevenue: number;
};

export type StudentRow = Student & {
  batchName: string;
  attendancePercent: number;
  feeStatus: "paid" | "pending" | "overdue";
};

export type HomeworkRow = Homework & { batchName?: string };
export type ExamRow = Omit<Exam, "results"> & {
  batchName?: string;
  stats: {
    average: number;
    averagePct: number;
    highest: number;
    lowest: number;
    count: number;
    passRate: number;
  };
  results: {
    studentId: string;
    studentName: string;
    marks: number | null;
    percent: number;
    rank: number;
  }[];
};

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await api<CentreSettings>("/v1/settings")).data,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CentreSettings>) =>
      api<CentreSettings>("/v1/settings", { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(qk.settings, data);
    },
    onError: (err) => toastError(err),
  });
}

export function useTeachers(q = "") {
  return useQuery({
    queryKey: qk.teachers(q),
    queryFn: async () => {
      const res = await api<TeacherRow[]>("/v1/teachers", { query: { q } });
      return { rows: res.data, meta: res.meta as { total: number; activeCount: number; onLeaveCount: number; monthlyPayroll: number } };
    },
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: qk.teacher(id),
    enabled: Boolean(id),
    queryFn: async () => (await api<TeacherRow>(`/v1/teachers/${id}`)).data,
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Teacher> & { name: string; phone: string }) =>
      api<TeacherRow>("/v1/teachers", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
    onError: (err) => toastError(err),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Teacher> & { id: string }) =>
      api<TeacherRow>(`/v1/teachers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
    onError: (err) => toastError(err),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/teachers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teachers"] }),
    onError: (err) => toastError(err),
  });
}

export function useBatches() {
  return useQuery({
    queryKey: qk.batches,
    queryFn: async () => (await api<BatchRow[]>("/v1/batches")).data,
  });
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: qk.batch(id),
    enabled: Boolean(id),
    queryFn: async () => (await api<BatchRow & { students: StudentRow[]; homework: Homework[]; exams: Exam[]; upcoming: unknown[] }>(`/v1/batches/${id}`)).data,
  });
}

export function useSchedule(from?: string, to?: string) {
  return useQuery({
    queryKey: qk.schedule(from, to),
    queryFn: async () => (await api("/v1/batches/schedule", { query: { from, to } })).data,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Batch, "id">) =>
      api<BatchRow>("/v1/batches", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
    onError: (err) => toastError(err),
  });
}

export function useUpdateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Batch> & { id: string }) =>
      api<BatchRow>(`/v1/batches/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: (err) => toastError(err),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/batches/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
    onError: (err) => toastError(err),
  });
}

export function useStudents(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: qk.students(filters),
    queryFn: async () => (await api<StudentRow[]>("/v1/students", { query: filters })).data,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: qk.student(id),
    enabled: Boolean(id),
    queryFn: async () => (await api<StudentRow & Record<string, unknown>>(`/v1/students/${id}`)).data,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Student, "id">) =>
      api<StudentRow>("/v1/students", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["parents"] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toastError(err),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Student> & { id: string }) =>
      api<StudentRow>(`/v1/students/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: qk.student(vars.id) });
    },
    onError: (err) => toastError(err),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/students/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
    onError: (err) => toastError(err),
  });
}

export function useRemindFee() {
  return useMutation({
    mutationFn: (id: string) => api(`/v1/students/${id}/remind-fee`, { method: "POST" }),
    onError: (err) => toastError(err),
  });
}

export function useAttendance(batchId: string, date: string) {
  return useQuery({
    queryKey: qk.attendance(batchId, date),
    enabled: Boolean(batchId && date),
    queryFn: async () =>
      (
        await api<{
          session: { id: string | null; batchId: string; date: string; saved: boolean };
          roster: { studentId: string; name: string; mark: "present" | "absent"; overallPercent: number }[];
          history: { id: string; date: string; present: number; total: number; percent: number }[];
          batchAttendancePercent: number;
        }>("/v1/attendance", { query: { batchId, date } })
      ).data,
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: qk.attendanceSummary,
    queryFn: async () => (await api("/v1/attendance/summary")).data as { present: number; total: number; batches: number },
  });
}

export function useSaveAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { batchId: string; date: string; entries: { studentId: string; mark: "present" | "absent" }[] }) =>
      api("/v1/attendance", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.attendance(vars.batchId, vars.date) });
      qc.invalidateQueries({ queryKey: qk.attendanceSummary });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toastError(err),
  });
}

export function useFeesSummary(month: string) {
  return useQuery({
    queryKey: qk.feesSummary(month),
    queryFn: async () => (await api(`/v1/fees/summary`, { query: { month } })).data as Record<string, unknown>,
  });
}

export function useFeeStudents(month: string, status = "", q = "") {
  return useQuery({
    queryKey: qk.feesStudents(month, status, q),
    queryFn: async () =>
      (
        await api<
          {
            id: string;
            name: string;
            className: string;
            batchName: string;
            parentPhone: string;
            monthlyFee: number;
            status: "paid" | "pending" | "overdue";
            payment: FeePayment | null;
          }[]
        >("/v1/fees/students", { query: { month, status, q } })
      ).data,
  });
}

export function useFeePayments(limit = 8) {
  return useQuery({
    queryKey: qk.feePayments(limit),
    queryFn: async () => (await api<FeePayment[]>("/v1/fees/payments", { query: { limit } })).data,
  });
}

export function useFeePayment(id: string) {
  return useQuery({
    queryKey: qk.feePayment(id),
    enabled: Boolean(id),
    queryFn: async () => (await api<FeePayment>(`/v1/fees/payments/${id}`)).data,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<FeePayment, "id" | "receiptNo">) =>
      api<FeePayment>("/v1/fees/payments", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fees"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
    onError: (err) => toastError(err),
  });
}

export function useSendFeeReminders() {
  return useMutation({
    mutationFn: (month?: string) =>
      api<{ sent: number }>("/v1/fees/reminders", { method: "POST", body: JSON.stringify({ month }) }).then((r) => r.data),
    onError: (err) => toastError(err),
  });
}

export function useHomework(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: qk.homework(filters),
    queryFn: async () => {
      const res = await api<HomeworkRow[]>("/v1/homework", { query: filters });
      return { rows: res.data, meta: res.meta as { total: number; pending: number; completed: number; overdue: number } };
    },
  });
}

export function useHomeworkOne(id: string) {
  return useQuery({
    queryKey: qk.homeworkOne(id),
    enabled: Boolean(id),
    queryFn: async () => (await api<HomeworkRow & { students: unknown[] }>(`/v1/homework/${id}`)).data,
  });
}

export function useCreateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Homework, "id">) =>
      api<HomeworkRow>("/v1/homework", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
    onError: (err) => toastError(err),
  });
}

export function useUpdateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Homework> & { id: string }) =>
      api<HomeworkRow>(`/v1/homework/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
    onError: (err) => toastError(err),
  });
}

export function useDeleteHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/homework/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
    onError: (err) => toastError(err),
  });
}

export function useShareHomework() {
  return useMutation({
    mutationFn: (id: string) => api(`/v1/homework/${id}/share`, { method: "POST" }),
    onError: (err) => toastError(err),
  });
}

export function useExams() {
  return useQuery({
    queryKey: qk.exams,
    queryFn: async () => (await api<ExamRow[]>("/v1/exams")).data,
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: qk.exam(id),
    enabled: Boolean(id),
    queryFn: async () => (await api<ExamRow>(`/v1/exams/${id}`)).data,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Exam, "id" | "results">) =>
      api<ExamRow>("/v1/exams", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
    onError: (err) => toastError(err),
  });
}

export function useSaveExamMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, results }: { id: string; results: { studentId: string; marks: number | null }[] }) =>
      api<ExamRow>(`/v1/exams/${id}/marks`, { method: "PUT", body: JSON.stringify({ results }) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
    onError: (err) => toastError(err),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/exams/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
    onError: (err) => toastError(err),
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: qk.announcements,
    queryFn: async () => (await api<Announcement[]>("/v1/announcements")).data,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Announcement, "id" | "createdAt">) =>
      api<Announcement>("/v1/announcements", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.announcements }),
    onError: (err) => toastError(err),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.announcements }),
    onError: (err) => toastError(err),
  });
}

export function useParents() {
  return useQuery({
    queryKey: qk.parents,
    queryFn: async () => (await api<(ParentAccount & { students: { id: string; name: string }[] })[]>("/v1/parents")).data,
  });
}

export function useParentPreview(studentId: string) {
  return useQuery({
    queryKey: qk.parentPreview(studentId),
    enabled: Boolean(studentId),
    queryFn: async () => (await api(`/v1/parents/preview/${studentId}`)).data,
  });
}

export function useInviteParent() {
  return useMutation({
    mutationFn: (id: string) => api(`/v1/parents/${id}/invite`, { method: "POST" }),
    onError: (err) => toastError(err),
  });
}

export function useParentAccount(id: string) {
  return useQuery({
    queryKey: qk.parent(id),
    enabled: Boolean(id),
    queryFn: async () =>
      (await api<ParentAccount & { students: { id: string; name: string }[] }>(`/v1/parents/${id}`)).data,
  });
}

export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; phone: string; email?: string; studentIds?: string[] }) =>
      api("/v1/parents", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.parents }),
    onError: (err) => toastError(err),
  });
}

export function useUpdateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Record<string, unknown>) =>
      api(`/v1/parents/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parents"] }),
    onError: (err) => toastError(err),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: async () => (await api<Record<string, unknown>>("/v1/dashboard")).data,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: qk.search(q),
    enabled: q.trim().length > 0,
    queryFn: async () =>
      (
        await api<{
          students: { id: string; name: string; className: string }[];
          batches: { id: string; name: string; subject: string }[];
          teachers: { id: string; name: string; subjects: string[] }[];
        }>("/v1/search", { query: { q } })
      ).data,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications,
    queryFn: async () =>
      (
        await api<{ id: string; title: string; detail: string; tone: string; kind: string; read: boolean; time: string }[]>(
          "/v1/notifications",
        )
      ).data,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/v1/notifications/read-all", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
    onError: (err) => toastError(err),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
    onError: (err) => toastError(err),
  });
}

export type ParentPortalAccount = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notifyFees: boolean;
  notifyAttendance: boolean;
  notifyHomework: boolean;
  notifyResults: boolean;
  notifyAnnouncements: boolean;
};

export type ParentChildOption = {
  id: string;
  name: string;
  className: string;
  batchName: string;
};

export type ParentMeData = {
  parent: ParentPortalAccount;
  children: ParentChildOption[];
  centre: { name: string; phone: string; address: string; city: string };
};

export type ParentScheduleClass = {
  batchId: string;
  subject: string;
  className: string;
  startTime: string;
  endTime: string;
  room: string;
  teacherName: string;
};

export type ParentDashboardData = {
  child: ParentChildOption;
  attendancePercent: number;
  feeStatus: "paid" | "pending" | "overdue";
  monthlyFee: number;
  pendingHomeworkCount: number;
  latestResult: {
    examName: string;
    subject: string;
    marks: number;
    maxMarks: number;
    percent: number;
    classAveragePct: number;
  } | null;
  nextClass: (ParentScheduleClass & { day: string; isToday: boolean }) | null;
  todayClasses: ParentScheduleClass[];
  pendingHomework: { id: string; title: string; subject: string; dueDate: string }[];
  announcements: { id: string; title: string; body: string; createdAt: string }[];
  teacher: { name: string; phone: string };
  parentName: string;
};

export type ParentAttendanceDay = { date: string; mark: string };

export type ParentAttendanceData = {
  overall: { percent: number; present: number; absent: number; total: number };
  month: { month: string; present: number; total: number; days: ParentAttendanceDay[] };
  trend: { month: string; label: string; percent: number; present: number; total: number }[];
  recentAbsences: ParentAttendanceDay[];
};

export type ParentFeePayment = {
  id: string;
  amount: number;
  paidOn: string;
  method: string;
  receiptNo: string;
  month: string;
  studentId: string;
  note?: string | null;
};

export type ParentFeeLedgerRow = {
  month: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  payment: ParentFeePayment | null;
};

export type ParentFeesData = {
  monthlyFee: number;
  lateFeeAmount: number;
  current: ParentFeeLedgerRow;
  paidTotal: number;
  pendingTotal: number;
  pendingMonths: number;
  ledger: ParentFeeLedgerRow[];
  centrePhone: string;
  centreName: string;
  centreAddress: string;
  centreCity: string;
  childName: string;
  className: string;
};

export type ParentHomeworkItem = {
  id: string;
  title: string;
  subject: string;
  description: string;
  assignedOn: string;
  dueDate: string;
  status: "pending" | "completed";
  overdue: boolean;
};

export type ParentExamResult = {
  exam: { id: string; name: string; subject: string; date: string; maxMarks: number };
  marks: number;
  percent: number;
  classAveragePct: number;
  classAverage: number;
  rank: number;
  outOf: number;
  aboveAverage: boolean;
};

export type ParentExamsData = {
  results: ParentExamResult[];
  averagePercent: number;
  bestPercent: number;
  childName: string;
  className: string;
};

export type ParentResultCardData = ParentExamsData & {
  centreName: string;
  academicYear: string;
};

export type ParentScheduleData = {
  today: string;
  days: { day: string; classes: ParentScheduleClass[] }[];
};

export type ParentChildData = {
  id: string;
  name: string;
  className: string;
  status: string;
  joiningDate: string;
  monthlyFee: number;
  feeStatus: string;
  parentName: string;
  parentPhone: string;
  address: string;
  subjects: string[];
  attendancePercent: number;
  attendancePresent: number;
  attendanceTotal: number;
  examAverage: number;
  examCount: number;
  batch: {
    name: string;
    days: string[];
    startTime: string;
    endTime: string;
    room: string;
    teacherName: string;
    teacherQualification: string;
    teacherPhone: string;
  };
};

export type ParentNotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  date: string;
};

export function parentQuery(studentId?: string | null) {
  return studentId ? { studentId } : undefined;
}

export function useParentDashboard(studentId?: string | null) {
  return useQuery({
    queryKey: qk.parentDashboard(studentId ?? undefined),
    enabled: Boolean(studentId),
    queryFn: async () => (await api<ParentDashboardData>("/v1/parent/dashboard", { query: parentQuery(studentId) })).data,
  });
}

export function useParentAttendance(studentId?: string | null, month?: string) {
  return useQuery({
    queryKey: qk.parentAttendance(studentId ?? undefined, month),
    enabled: Boolean(studentId),
    queryFn: async () =>
      (await api<ParentAttendanceData>("/v1/parent/attendance", { query: { ...parentQuery(studentId), month } })).data,
  });
}

export function useParentFees(studentId?: string | null) {
  return useQuery({
    queryKey: qk.parentFees(studentId ?? undefined),
    enabled: Boolean(studentId),
    queryFn: async () => (await api<ParentFeesData>("/v1/parent/fees", { query: parentQuery(studentId) })).data,
  });
}

export function useParentHomework(studentId?: string | null, status?: string) {
  return useQuery({
    queryKey: qk.parentHomework(studentId ?? undefined, status),
    enabled: Boolean(studentId),
    queryFn: async () =>
      (await api<ParentHomeworkItem[]>("/v1/parent/homework", { query: { ...parentQuery(studentId), status } })).data,
  });
}

export function useParentExams(studentId?: string | null) {
  return useQuery({
    queryKey: qk.parentExams(studentId ?? undefined),
    enabled: Boolean(studentId),
    queryFn: async () => (await api<ParentExamsData>("/v1/parent/exams", { query: parentQuery(studentId) })).data,
  });
}

export function useParentSchedule(studentId?: string | null) {
  return useQuery({
    queryKey: qk.parentSchedule(studentId ?? undefined),
    enabled: Boolean(studentId),
    queryFn: async () => (await api<ParentScheduleData>("/v1/parent/schedule", { query: parentQuery(studentId) })).data,
  });
}

export function useParentChild(studentId?: string | null) {
  return useQuery({
    queryKey: qk.parentChild(studentId ?? undefined),
    enabled: Boolean(studentId),
    queryFn: async () => (await api<ParentChildData>("/v1/parent/child", { query: parentQuery(studentId) })).data,
  });
}

export function useParentNotifications(studentId?: string | null, kind?: string) {
  return useQuery({
    queryKey: qk.parentNotifications(studentId ?? undefined, kind),
    enabled: Boolean(studentId),
    queryFn: async () =>
      (await api<ParentNotificationItem[]>("/v1/parent/notifications", { query: { ...parentQuery(studentId), kind } }))
        .data,
  });
}

export function useParentProfile() {
  return useQuery({
    queryKey: qk.parentProfile,
    queryFn: async () => (await api<ParentMeData>("/v1/parent/profile")).data,
  });
}

export function useParentMe() {
  return useQuery({
    queryKey: qk.parentMe,
    queryFn: async () => (await api<ParentMeData>("/v1/parent/auth/me")).data,
  });
}

export function useUpdateParentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      api<ParentPortalAccount>("/v1/parent/profile", { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.parentProfile });
      qc.invalidateQueries({ queryKey: qk.parentMe });
    },
    onError: (err) => toastError(err),
  });
}

export function useUpdateParentAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, boolean>) =>
      api<ParentPortalAccount>("/v1/parent/profile/alerts", { method: "PATCH", body: JSON.stringify(patch) }).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.parentProfile });
      qc.invalidateQueries({ queryKey: qk.parentMe });
    },
    onError: (err) => toastError(err),
  });
}

export function useParentPayUpi() {
  return useMutation({
    mutationFn: (body: { studentId: string; month: string }) =>
      api<{ message: string }>("/v1/parent/fees/pay-upi", { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
    onError: (err) => toastError(err),
  });
}

export function useParentPayAtCentre() {
  return useMutation({
    mutationFn: (body: { studentId: string; month: string }) =>
      api<{ message: string }>("/v1/parent/fees/pay-at-centre", { method: "POST", body: JSON.stringify(body) }).then(
        (r) => r.data,
      ),
    onError: (err) => toastError(err),
  });
}

export function useParentResultCard(studentId?: string | null) {
  return useQuery({
    queryKey: qk.parentResultCard(studentId ?? undefined),
    enabled: Boolean(studentId),
    queryFn: async () => (await api<ParentResultCardData>("/v1/parent/exams/result-card", { query: parentQuery(studentId) })).data,
  });
}

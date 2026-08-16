import { CURRENT_MONTH, TODAY, WEEKDAYS } from "@/lib/format";
import type { AttendanceRecord, Batch, Exam, FeePayment, Student } from "@/data/types";

export const weekdayOf = (date: string) => WEEKDAYS[(new Date(date).getDay() + 6) % 7]!;

export const studentsOfBatch = (students: Student[], batchId: string) =>
  students.filter((s) => s.batchId === batchId);

export const attendancePct = (attendance: AttendanceRecord[], studentId: string) => {
  const entries = attendance.flatMap((a) => a.entries.filter((e) => e.studentId === studentId));
  if (!entries.length) return 0;
  return (entries.filter((e) => e.mark === "present").length / entries.length) * 100;
};

export const batchAttendancePct = (attendance: AttendanceRecord[], batchId: string) => {
  const records = attendance.filter((a) => a.batchId === batchId);
  const entries = records.flatMap((r) => r.entries);
  if (!entries.length) return 0;
  return (entries.filter((e) => e.mark === "present").length / entries.length) * 100;
};

export const todayAttendanceSummary = (attendance: AttendanceRecord[]) => {
  const records = attendance.filter((a) => a.date === TODAY);
  const entries = records.flatMap((r) => r.entries);
  const present = entries.filter((e) => e.mark === "present").length;
  return { present, total: entries.length, batches: records.length };
};

export type StudentFeeStatus = "paid" | "pending" | "overdue";

export const studentFeeStatus = (
  payments: FeePayment[],
  student: Student,
  month: string,
  dueDay = 5,
): StudentFeeStatus => {
  const paid = payments.some((p) => p.studentId === student.id && p.month === month);
  if (paid) return "paid";
  const dayOfMonth = Number(TODAY.slice(8, 10));
  const isPastMonth = month < CURRENT_MONTH;
  if (isPastMonth || (month === CURRENT_MONTH && dayOfMonth > dueDay)) return "overdue";
  return "pending";
};

export const feeSummary = (students: Student[], payments: FeePayment[], month: string, dueDay = 5) => {
  const active = students.filter((s) => s.status === "active");
  const expected = active.reduce((sum, s) => sum + s.monthlyFee, 0);
  const monthPayments = payments.filter((p) => p.month === month);
  const collected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const overdue = active.filter((s) => studentFeeStatus(payments, s, month, dueDay) === "overdue");
  return {
    expected,
    collected,
    pending: Math.max(0, expected - collected),
    overdueCount: overdue.length,
    overdueStudents: overdue,
    paidCount: monthPayments.length,
    collectionRate: expected ? (collected / expected) * 100 : 0,
  };
};

export const classesOnDate = (batches: Batch[], date: string) => {
  const weekday = weekdayOf(date);
  return batches
    .filter((b) => b.status === "active" && b.days.includes(weekday))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const upcomingClasses = (batches: Batch[], days = 3) => {
  const out: { date: string; batch: Batch }[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    classesOnDate(batches, date).forEach((batch) => out.push({ date, batch }));
  }
  return out;
};

export const examStats = (exam: Exam) => {
  const scored = exam.results.filter((r) => r.marks !== null) as { studentId: string; marks: number }[];
  if (!scored.length) return { average: 0, averagePct: 0, highest: 0, lowest: 0, count: 0, passRate: 0 };
  const total = scored.reduce((s, r) => s + r.marks, 0);
  const average = total / scored.length;
  return {
    average,
    averagePct: (average / exam.maxMarks) * 100,
    highest: Math.max(...scored.map((r) => r.marks)),
    lowest: Math.min(...scored.map((r) => r.marks)),
    count: scored.length,
    passRate: (scored.filter((r) => r.marks / exam.maxMarks >= 0.35).length / scored.length) * 100,
  };
};

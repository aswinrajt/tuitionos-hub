import { CURRENT_MONTH, TODAY, WEEKDAYS, monthOffset } from "@/data/mock";
import { studentFeeStatus, weekdayOf } from "@/lib/selectors";
import type {
  Announcement,
  AttendanceRecord,
  Batch,
  Exam,
  FeePayment,
  Homework,
  Student,
} from "@/data/types";

/** Attendance rows for a single student, newest first. */
export const childAttendance = (attendance: AttendanceRecord[], student: Student) =>
  attendance
    .filter((a) => a.batchId === student.batchId)
    .flatMap((a) =>
      a.entries
        .filter((e) => e.studentId === student.id)
        .map((e) => ({ date: a.date, mark: e.mark })),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

export const childAttendanceSummary = (attendance: AttendanceRecord[], student: Student) => {
  const rows = childAttendance(attendance, student);
  const present = rows.filter((r) => r.mark === "present").length;
  const absent = rows.length - present;
  return {
    rows,
    present,
    absent,
    total: rows.length,
    percent: rows.length ? (present / rows.length) * 100 : 0,
    recentAbsences: rows.filter((r) => r.mark === "absent").slice(0, 5),
  };
};

/** Calendar cells (with leading blanks) for one month, marked from attendance. */
export const attendanceCalendar = (
  rows: { date: string; mark: string }[],
  month: string,
) => {
  const [year, m] = month.split("-").map(Number) as [number, number];
  const first = new Date(year, m - 1, 1);
  const daysInMonth = new Date(year, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: ({ date: string; mark: string | null } | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    cells.push({ date, mark: rows.find((r) => r.date === date)?.mark ?? null });
  }
  return cells;
};

export const monthlyAttendanceTrend = (rows: { date: string; mark: string }[], months = 4) =>
  Array.from({ length: months }, (_, i) => {
    const month = monthOffset(-(months - 1 - i));
    const inMonth = rows.filter((r) => r.date.startsWith(month));
    const present = inMonth.filter((r) => r.mark === "present").length;
    return {
      month,
      label: new Date(`${month}-01`).toLocaleDateString("en-IN", { month: "short" }),
      percent: inMonth.length ? (present / inMonth.length) * 100 : 0,
      present,
      total: inMonth.length,
    };
  });

/** Fee ledger for the last N months for one child. */
export const childFeeLedger = (
  payments: FeePayment[],
  student: Student,
  dueDay: number,
  months = 6,
) =>
  Array.from({ length: months }, (_, i) => {
    const month = monthOffset(-i);
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    return {
      month,
      amount: payment?.amount ?? student.monthlyFee,
      payment: payment ?? null,
      dueDate: `${month}-${String(dueDay).padStart(2, "0")}`,
      status: studentFeeStatus(payments, student, month, dueDay),
    };
  });

export const childHomework = (homework: Homework[], student: Student) =>
  homework
    .filter((h) => h.batchId === student.batchId)
    .sort((a, b) => b.assignedOn.localeCompare(a.assignedOn));

export const childExams = (exams: Exam[], student: Student) =>
  exams
    .filter((e) => e.batchId === student.batchId && e.results.some((r) => r.studentId === student.id && r.marks !== null))
    .map((exam) => {
      const marks = exam.results.find((r) => r.studentId === student.id)?.marks ?? 0;
      const scored = exam.results.filter((r) => r.marks !== null).map((r) => r.marks as number);
      const classAvg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 0;
      const ranked = [...scored].sort((a, b) => b - a);
      return {
        exam,
        marks,
        percent: (marks / exam.maxMarks) * 100,
        classAveragePct: (classAvg / exam.maxMarks) * 100,
        classAverage: classAvg,
        rank: ranked.indexOf(marks) + 1,
        outOf: scored.length,
      };
    })
    .sort((a, b) => b.exam.date.localeCompare(a.exam.date));

/** Weekly timetable rows for the child's batch (plus any batch of the same class). */
export const childSchedule = (batches: Batch[], student: Student) => {
  const relevant = batches.filter(
    (b) => b.status === "active" && (b.id === student.batchId || b.className === student.className),
  );
  return WEEKDAYS.map((day) => ({
    day,
    classes: relevant
      .filter((b) => b.days.includes(day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));
};

export const nextClassFor = (batches: Batch[], student: Student) => {
  const schedule = childSchedule(batches, student);
  const todayName = weekdayOf(TODAY);
  const nowTime = new Date().toTimeString().slice(0, 5);
  const startIndex = WEEKDAYS.indexOf(todayName);
  for (let offset = 0; offset < 8; offset++) {
    const day = WEEKDAYS[(startIndex + offset) % 7]!;
    const entry = schedule.find((s) => s.day === day);
    const match = entry?.classes.find((b) => offset > 0 || b.startTime > nowTime);
    if (match) return { batch: match, day, isToday: offset === 0 };
  }
  return null;
};

export type ParentNotification = {
  id: string;
  kind: "fee" | "attendance" | "homework" | "exam" | "announcement";
  title: string;
  body: string;
  date: string;
};

/** Notification feed derived from what the admin/teacher recorded. */
export const parentNotifications = (input: {
  student: Student;
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  homework: Homework[];
  exams: Exam[];
  announcements: Announcement[];
  dueDay: number;
}): ParentNotification[] => {
  const { student, attendance, payments, homework, exams, announcements, dueDay } = input;
  const items: ParentNotification[] = [];

  const feeStatus = studentFeeStatus(payments, student, CURRENT_MONTH, dueDay);
  const thisMonthPayment = payments.find((p) => p.studentId === student.id && p.month === CURRENT_MONTH);
  if (thisMonthPayment) {
    items.push({
      id: `n-fee-${thisMonthPayment.id}`,
      kind: "fee",
      title: "Fee payment received",
      body: `We received ₹${thisMonthPayment.amount.toLocaleString("en-IN")} for ${student.name} via ${thisMonthPayment.method}. Receipt ${thisMonthPayment.receiptNo}.`,
      date: thisMonthPayment.paidOn,
    });
  } else {
    items.push({
      id: `n-fee-${CURRENT_MONTH}`,
      kind: "fee",
      title: feeStatus === "overdue" ? "Fee payment overdue" : "Fee due reminder",
      body: `₹${student.monthlyFee.toLocaleString("en-IN")} is ${feeStatus === "overdue" ? "overdue" : "due"} for this month. Due date is the ${dueDay}th.`,
      date: `${CURRENT_MONTH}-${String(dueDay).padStart(2, "0")}`,
    });
  }

  childAttendance(attendance, student)
    .filter((r) => r.mark === "absent")
    .slice(0, 4)
    .forEach((r) =>
      items.push({
        id: `n-abs-${r.date}`,
        kind: "attendance",
        title: "Marked absent",
        body: `${student.name} was marked absent for class on this date.`,
        date: r.date,
      }),
    );

  childHomework(homework, student)
    .slice(0, 4)
    .forEach((h) =>
      items.push({
        id: `n-hw-${h.id}`,
        kind: "homework",
        title: `New homework: ${h.subject}`,
        body: `${h.title} — due ${h.dueDate}.`,
        date: h.assignedOn,
      }),
    );

  childExams(exams, student)
    .slice(0, 3)
    .forEach((r) =>
      items.push({
        id: `n-ex-${r.exam.id}`,
        kind: "exam",
        title: `Result published: ${r.exam.name}`,
        body: `${student.name} scored ${r.marks}/${r.exam.maxMarks} (${Math.round(r.percent)}%). Class average ${Math.round(r.classAveragePct)}%.`,
        date: r.exam.date,
      }),
    );

  announcements
    .filter((a) => a.audience === "all" || a.audience === student.batchId)
    .forEach((a) =>
      items.push({
        id: `n-an-${a.id}`,
        kind: "announcement",
        title: a.title,
        body: a.body,
        date: a.createdAt,
      }),
    );

  return items.sort((a, b) => b.date.localeCompare(a.date));
};

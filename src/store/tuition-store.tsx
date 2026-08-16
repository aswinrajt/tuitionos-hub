import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import * as mock from "@/data/mock";
import type {
  ActivityItem,
  AttendanceMark,
  AttendanceRecord,
  Batch,
  CentreSettings,
  Exam,
  FeePayment,
  Homework,
  Student,
  Teacher,
} from "@/data/types";

const uid = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`;

interface StoreValue {
  students: Student[];
  batches: Batch[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  feePayments: FeePayment[];
  homework: Homework[];
  exams: Exam[];
  activities: ActivityItem[];
  settings: CentreSettings;
  addStudent: (s: Omit<Student, "id">) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addBatch: (b: Omit<Batch, "id">) => Batch;
  updateBatch: (id: string, patch: Partial<Batch>) => void;
  deleteBatch: (id: string) => void;
  addTeacher: (t: Omit<Teacher, "id">) => Teacher;
  updateTeacher: (id: string, patch: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  saveAttendance: (batchId: string, date: string, entries: { studentId: string; mark: AttendanceMark }[]) => void;
  recordPayment: (input: Omit<FeePayment, "id" | "receiptNo">) => FeePayment;
  addHomework: (h: Omit<Homework, "id">) => Homework;
  updateHomework: (id: string, patch: Partial<Homework>) => void;
  deleteHomework: (id: string) => void;
  addExam: (e: Omit<Exam, "id">) => Exam;
  saveExamMarks: (examId: string, results: { studentId: string; marks: number | null }[]) => void;
  deleteExam: (id: string) => void;
  updateSettings: (patch: Partial<CentreSettings>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function TuitionStoreProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(mock.students);
  const [batches, setBatches] = useState<Batch[]>(mock.batches);
  const [teachers, setTeachers] = useState<Teacher[]>(mock.teachers);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(mock.attendance);
  const [feePayments, setFeePayments] = useState<FeePayment[]>(mock.feePayments);
  const [homework, setHomework] = useState<Homework[]>(mock.homework);
  const [exams, setExams] = useState<Exam[]>(mock.exams);
  const [activities, setActivities] = useState<ActivityItem[]>(mock.activities);
  const [settings, setSettings] = useState<CentreSettings>(mock.settings);

  const log = useCallback((type: ActivityItem["type"], message: string) => {
    setActivities((prev) => [{ id: uid("ac"), type, message, time: "Just now" }, ...prev].slice(0, 25));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      students,
      batches,
      teachers,
      attendance,
      feePayments,
      homework,
      exams,
      activities,
      settings,
      addStudent: (s) => {
        const student: Student = { ...s, id: uid("s") };
        setStudents((prev) => [student, ...prev]);
        log("student", `New student ${student.name} added`);
        return student;
      },
      updateStudent: (id, patch) => {
        setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
        log("student", `Student details updated`);
      },
      deleteStudent: (id) => {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        log("student", `A student record was removed`);
      },
      addBatch: (b) => {
        const batch: Batch = { ...b, id: uid("b") };
        setBatches((prev) => [batch, ...prev]);
        log("batch", `Batch ${batch.name} created`);
        return batch;
      },
      updateBatch: (id, patch) => {
        setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
        log("batch", `Batch details updated`);
      },
      deleteBatch: (id) => {
        setBatches((prev) => prev.filter((b) => b.id !== id));
        log("batch", `A batch was removed`);
      },
      addTeacher: (t) => {
        const teacher: Teacher = { ...t, id: uid("t") };
        setTeachers((prev) => [teacher, ...prev]);
        log("batch", `Teacher ${teacher.name} added`);
        return teacher;
      },
      updateTeacher: (id, patch) =>
        setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTeacher: (id) => setTeachers((prev) => prev.filter((t) => t.id !== id)),
      saveAttendance: (batchId, date, entries) => {
        setAttendance((prev) => {
          const existing = prev.find((a) => a.batchId === batchId && a.date === date);
          if (existing)
            return prev.map((a) => (a === existing ? { ...a, entries } : a));
          return [...prev, { id: uid("a"), batchId, date, entries }];
        });
        const batch = batches.find((b) => b.id === batchId);
        log("attendance", `Attendance saved for ${batch?.name ?? "batch"}`);
      },
      recordPayment: (input) => {
        const payment: FeePayment = {
          ...input,
          id: uid("f"),
          receiptNo: `RCPT-${1100 + Math.floor(Math.random() * 800)}`,
        };
        setFeePayments((prev) => [payment, ...prev]);
        const student = students.find((s) => s.id === input.studentId);
        log("fee", `Fee of ₹${input.amount.toLocaleString("en-IN")} received from ${student?.name ?? "student"}`);
        return payment;
      },
      addHomework: (h) => {
        const hw: Homework = { ...h, id: uid("h") };
        setHomework((prev) => [hw, ...prev]);
        log("homework", `Homework '${hw.title}' assigned`);
        return hw;
      },
      updateHomework: (id, patch) =>
        setHomework((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h))),
      deleteHomework: (id) => setHomework((prev) => prev.filter((h) => h.id !== id)),
      addExam: (e) => {
        const exam: Exam = { ...e, id: uid("e") };
        setExams((prev) => [exam, ...prev]);
        log("exam", `Exam '${exam.name}' created`);
        return exam;
      },
      saveExamMarks: (examId, results) => {
        setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, results } : e)));
        log("exam", `Marks updated for an exam`);
      },
      deleteExam: (id) => setExams((prev) => prev.filter((e) => e.id !== id)),
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
    }),
    [students, batches, teachers, attendance, feePayments, homework, exams, activities, settings, log],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside TuitionStoreProvider");
  return ctx;
}

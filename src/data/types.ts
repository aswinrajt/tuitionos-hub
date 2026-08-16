export type StudentStatus = "active" | "inactive";
export type FeeStatus = "paid" | "pending" | "overdue";
export type AttendanceMark = "present" | "absent";

export interface Student {
  id: string;
  name: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  className: string;
  batchId: string;
  subjects: string[];
  joiningDate: string;
  monthlyFee: number;
  status: StudentStatus;
  gender: "Male" | "Female";
  address: string;
}

export interface Batch {
  id: string;
  name: string;
  className: string;
  subject: string;
  teacherId: string;
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  status: "active" | "archived";
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  subjects: string[];
  qualification: string;
  joiningDate: string;
  status: "active" | "on-leave";
  monthlySalary: number;
}

export interface AttendanceRecord {
  id: string;
  batchId: string;
  date: string;
  entries: { studentId: string; mark: AttendanceMark }[];
}

export interface FeePayment {
  id: string;
  studentId: string;
  month: string; // YYYY-MM
  amount: number;
  paidOn: string;
  method: "Cash" | "UPI" | "Bank Transfer" | "Cheque";
  receiptNo: string;
  note?: string;
}

export interface Homework {
  id: string;
  batchId: string;
  subject: string;
  title: string;
  description: string;
  assignedOn: string;
  dueDate: string;
  status: "pending" | "completed";
}

export interface ExamResult {
  studentId: string;
  marks: number | null;
}

export interface Exam {
  id: string;
  name: string;
  batchId: string;
  subject: string;
  date: string;
  maxMarks: number;
  results: ExamResult[];
}

export interface ActivityItem {
  id: string;
  type: "fee" | "student" | "attendance" | "homework" | "exam" | "batch";
  message: string;
  time: string;
}

export interface CentreSettings {
  centreName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  gstin: string;
  academicYear: string;
  currency: string;
  feeDueDay: number;
  lateFeeAmount: number;
  reminderDaysBefore: number;
  notifyFeeDue: boolean;
  notifyAbsent: boolean;
  notifyExamResults: boolean;
  notifyHomework: boolean;
  weeklyReport: boolean;
  classes: string[];
  subjects: string[];
}

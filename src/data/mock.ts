import type {
  ActivityItem,
  AttendanceRecord,
  Batch,
  CentreSettings,
  Exam,
  FeePayment,
  Homework,
  Student,
  Teacher,
} from "./types";

const now = new Date();
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const shift = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return iso(d);
};
export const TODAY = iso(now);
export const CURRENT_MONTH = TODAY.slice(0, 7);
export const monthOffset = (offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
export const SUBJECTS = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "English", "Social Science", "Computer Science"];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const teachers: Teacher[] = [
  { id: "t1", name: "Ramesh Iyer", phone: "+91 98450 11223", email: "ramesh.iyer@vidyaclasses.in", subjects: ["Mathematics", "Physics"], qualification: "M.Sc Mathematics, B.Ed", joiningDate: "2021-04-12", status: "active", monthlySalary: 42000 },
  { id: "t2", name: "Sunita Deshmukh", phone: "+91 99202 44551", email: "sunita.d@vidyaclasses.in", subjects: ["Science", "Biology"], qualification: "M.Sc Zoology", joiningDate: "2022-06-01", status: "active", monthlySalary: 38000 },
  { id: "t3", name: "Arvind Nair", phone: "+91 97411 88220", email: "arvind.nair@vidyaclasses.in", subjects: ["Chemistry", "Science"], qualification: "M.Sc Chemistry", joiningDate: "2023-01-09", status: "active", monthlySalary: 36000 },
  { id: "t4", name: "Priya Sharma", phone: "+91 98110 33447", email: "priya.sharma@vidyaclasses.in", subjects: ["English", "Social Science"], qualification: "M.A English", joiningDate: "2020-07-15", status: "on-leave", monthlySalary: 34000 },
  { id: "t5", name: "Kaushik Bose", phone: "+91 90070 22114", email: "kaushik.bose@vidyaclasses.in", subjects: ["Computer Science", "Mathematics"], qualification: "B.Tech CSE", joiningDate: "2024-02-20", status: "active", monthlySalary: 40000 },
];

export const batches: Batch[] = [
  { id: "b1", name: "X-A Maths Morning", className: "Class 10", subject: "Mathematics", teacherId: "t1", days: ["Mon", "Wed", "Fri"], startTime: "07:00", endTime: "08:30", room: "Room 1", status: "active" },
  { id: "b2", name: "X-B Science Evening", className: "Class 10", subject: "Science", teacherId: "t2", days: ["Tue", "Thu", "Sat"], startTime: "17:30", endTime: "19:00", room: "Room 2", status: "active" },
  { id: "b3", name: "XII PCM Batch", className: "Class 12", subject: "Physics", teacherId: "t1", days: ["Mon", "Tue", "Thu"], startTime: "18:00", endTime: "20:00", room: "Hall A", status: "active" },
  { id: "b4", name: "IX Foundation", className: "Class 9", subject: "Mathematics", teacherId: "t5", days: ["Mon", "Wed", "Sat"], startTime: "16:00", endTime: "17:30", room: "Room 3", status: "active" },
  { id: "b5", name: "XI Chemistry", className: "Class 11", subject: "Chemistry", teacherId: "t3", days: ["Wed", "Fri", "Sun"], startTime: "09:00", endTime: "10:30", room: "Lab 1", status: "active" },
  { id: "b6", name: "VIII English Spoken", className: "Class 8", subject: "English", teacherId: "t4", days: ["Tue", "Fri"], startTime: "15:00", endTime: "16:00", room: "Room 1", status: "active" },
];

const firstNames = ["Aarav", "Diya", "Rohan", "Ananya", "Kabir", "Meera", "Aditya", "Ishita", "Vivaan", "Saanvi", "Arjun", "Riya", "Karthik", "Nandini", "Yash", "Tanvi", "Siddharth", "Pooja", "Manav", "Sneha", "Harsh", "Kavya", "Devansh", "Aditi", "Nikhil", "Shreya", "Rahul", "Anika"];
const lastNames = ["Sharma", "Patel", "Reddy", "Nair", "Iyer", "Verma", "Gupta", "Joshi", "Mehta", "Rao", "Kulkarni", "Chatterjee", "Singh", "Desai"];
const parentFirst = ["Suresh", "Anita", "Mahesh", "Lata", "Vijay", "Rekha", "Prakash", "Sarika", "Dinesh", "Kavita"];
const areas = ["Indiranagar", "Kothrud", "Adyar", "Vasant Kunj", "Andheri West", "Salt Lake", "Banjara Hills", "Rajajinagar"];

const feeByClass: Record<string, number> = {
  "Class 8": 1200, "Class 9": 1500, "Class 10": 1800, "Class 11": 2200, "Class 12": 2500,
};

export const students: Student[] = Array.from({ length: 26 }).map((_, i) => {
  const batch = batches[i % batches.length];
  const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
  const subjects = [batch.subject, ...(i % 3 === 0 ? ["English"] : i % 3 === 1 ? ["Mathematics"] : ["Science"])].filter((s, idx, arr) => arr.indexOf(s) === idx);
  return {
    id: `s${i + 1}`,
    name,
    phone: `+91 9${(800000000 + i * 1237891) .toString().slice(0, 9)}`,
    parentName: `${parentFirst[i % parentFirst.length]} ${name.split(" ")[1]}`,
    parentPhone: `+91 9${(700000000 + i * 998877).toString().slice(0, 9)}`,
    className: batch.className,
    batchId: batch.id,
    subjects,
    joiningDate: shift(-(30 + i * 11)),
    monthlyFee: feeByClass[batch.className] ?? 1500,
    status: i % 13 === 12 ? "inactive" : "active",
    gender: i % 2 === 0 ? "Male" : "Female",
    address: `${12 + i}, ${areas[i % areas.length]}`,
  } satisfies Student;
});

// ---- Attendance for last 24 days ----
export const attendance: AttendanceRecord[] = [];
for (let d = 24; d >= 0; d--) {
  const date = shift(-d);
  const weekday = WEEKDAYS[(new Date(date).getDay() + 6) % 7];
  batches.forEach((b) => {
    if (!b.days.includes(weekday)) return;
    if (d === 0 && b.startTime > "12:00") return; // evening classes not marked yet today
    const roster = students.filter((s) => s.batchId === b.id && s.status === "active");
    attendance.push({
      id: `a-${b.id}-${date}`,
      batchId: b.id,
      date,
      entries: roster.map((s, idx) => ({
        studentId: s.id,
        mark: (idx + d) % 9 === 0 ? "absent" : "present",
      })),
    });
  });
}

// ---- Fee payments ----
export const feePayments: FeePayment[] = [];
let receipt = 1041;
[monthOffset(-2), monthOffset(-1), CURRENT_MONTH].forEach((month, mIdx) => {
  students.forEach((s, i) => {
    const skip = mIdx === 2 ? i % 3 === 0 : i % 11 === 0;
    if (skip || s.status === "inactive") return;
    feePayments.push({
      id: `f${month}-${s.id}`,
      studentId: s.id,
      month,
      amount: s.monthlyFee,
      paidOn: mIdx === 2 ? shift(-((i % 12) + 1)) : `${month}-${String(((i % 20) + 3)).padStart(2, "0")}`,
      method: (["UPI", "Cash", "Bank Transfer", "Cheque"] as const)[i % 4],
      receiptNo: `RCPT-${receipt++}`,
    });
  });
});

// ---- Homework ----
export const homework: Homework[] = [
  { id: "h1", batchId: "b1", subject: "Mathematics", title: "Quadratic Equations - Ex 4.3", description: "Solve all questions from Exercise 4.3 (NCERT) and revise the discriminant method.", assignedOn: shift(-1), dueDate: shift(2), status: "pending" },
  { id: "h2", batchId: "b2", subject: "Science", title: "Chemical Reactions worksheet", description: "Complete the balancing equations worksheet handed out in class.", assignedOn: shift(-3), dueDate: shift(1), status: "pending" },
  { id: "h3", batchId: "b3", subject: "Physics", title: "Numericals on Electrostatics", description: "Q1 to Q15 from the assignment sheet. Show all steps.", assignedOn: shift(-5), dueDate: shift(-1), status: "completed" },
  { id: "h4", batchId: "b4", subject: "Mathematics", title: "Polynomials revision", description: "Revise chapter 2 and attempt the 20-mark practice test at home.", assignedOn: shift(-2), dueDate: shift(3), status: "pending" },
  { id: "h5", batchId: "b5", subject: "Chemistry", title: "Mole concept problems", description: "Solve numerical set B; bring doubts to next class.", assignedOn: shift(-7), dueDate: shift(-3), status: "completed" },
  { id: "h6", batchId: "b6", subject: "English", title: "Letter writing practice", description: "Write a formal letter to the editor on traffic safety (150 words).", assignedOn: TODAY, dueDate: shift(4), status: "pending" },
  { id: "h7", batchId: "b1", subject: "Mathematics", title: "Trigonometry MCQ set", description: "Attempt 25 MCQs from the printed booklet.", assignedOn: shift(-9), dueDate: shift(-6), status: "completed" },
];

// ---- Exams ----
const mk = (id: string, name: string, batchId: string, subject: string, dayOffset: number, maxMarks: number, seed: number): Exam => ({
  id, name, batchId, subject, date: shift(dayOffset), maxMarks,
  results: students
    .filter((s) => s.batchId === batchId && s.status === "active")
    .map((s, i) => ({ studentId: s.id, marks: Math.min(maxMarks, Math.round(maxMarks * (0.55 + ((i * seed) % 40) / 100))) })),
});

export const exams: Exam[] = [
  mk("e1", "Monthly Test - August", "b1", "Mathematics", -6, 50, 7),
  mk("e2", "Unit Test 2", "b2", "Science", -12, 40, 5),
  mk("e3", "Term 1 Physics", "b3", "Physics", -20, 70, 9),
  mk("e4", "Foundation Assessment", "b4", "Mathematics", -3, 50, 3),
  mk("e5", "Chemistry Weekly Test", "b5", "Chemistry", -9, 25, 11),
];

export const activities: ActivityItem[] = [
  { id: "ac1", type: "fee", message: "Fee of ₹1,800 received from Aarav Sharma (UPI)", time: "10 min ago" },
  { id: "ac2", type: "attendance", message: "Attendance marked for X-A Maths Morning", time: "1 hour ago" },
  { id: "ac3", type: "student", message: "New student Anika Desai admitted to IX Foundation", time: "3 hours ago" },
  { id: "ac4", type: "homework", message: "Homework 'Letter writing practice' assigned to VIII English Spoken", time: "5 hours ago" },
  { id: "ac5", type: "exam", message: "Marks published for Monthly Test - August", time: "Yesterday" },
  { id: "ac6", type: "batch", message: "Batch XI Chemistry schedule updated to 9:00 AM", time: "Yesterday" },
  { id: "ac7", type: "fee", message: "Reminder sent to 8 parents for pending August fees", time: "2 days ago" },
];

export const settings: CentreSettings = {
  centreName: "Vidya Classes",
  ownerName: "Anil Kumar",
  ownerEmail: "anil@vidyaclasses.in",
  ownerPhone: "+91 98860 45120",
  address: "2nd Floor, Shanti Complex, 100ft Road",
  city: "Bengaluru",
  gstin: "29ABCDE1234F1Z5",
  academicYear: "2026-27",
  currency: "INR",
  feeDueDay: 5,
  lateFeeAmount: 100,
  reminderDaysBefore: 3,
  notifyFeeDue: true,
  notifyAbsent: true,
  notifyExamResults: true,
  notifyHomework: false,
  weeklyReport: true,
  classes: CLASSES,
  subjects: SUBJECTS,
};

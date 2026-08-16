# TuitionOS — Backend Implementation Spec

This document is derived from the current frontend (`tuitionos-hub`). The UI is a complete SaaS MVP with **in-memory mock data** (`src/store/tuition-store.tsx`, `src/data/mock.ts`). There is **no API yet**. The backend should replace that store 1:1 so every screen, modal, filter, and action continues to work.

---

## 1. What the UI actually does

TuitionOS is a **multi-tenant tuition-centre product** with two audiences:

| Audience | Entry | Purpose |
|---|---|---|
| Staff (owner / teacher) | `/login` | Run the centre: students, batches, attendance, fees, homework, exams, teachers, parents, settings |
| Parent | `/parent/login` | Read-only view of a linked child: attendance, fees, homework, results, timetable, notices |

All staff data is **centre-scoped**. A parent only ever sees children linked to their account at that centre.

### 1.1 Staff screens → backend needs

| UI route | Reads | Writes |
|---|---|---|
| `/login` | — | Register centre, login, forgot password, demo login |
| `/` Dashboard | Counts, fee summary, attendance today, 5-month collection trend, 7-day attendance trend, today's classes, overdue students, upcoming classes, recent activity | Add student / batch / homework / fee (modals) |
| `/students` | List + search (name, phone, parent) + filters (class, batch, status). Columns: attendance %, monthly fee, fee status | Create, update, delete, record fee |
| `/students/:id` | Profile, attendance history (last 24), fee history, homework, exam results, batch schedule | Edit, delete, record fee, send fee reminder, “call parent” (no-op / placeholder) |
| `/batches` | Cards with teacher, timing, student count, attendance %. Today's / upcoming classes | Create, update, delete |
| `/batches/:id` | Roster, homework, exams, upcoming classes, monthly revenue | Edit batch, add homework |
| `/attendance` | Roster for batch+date, saved session, history (12), today summary, pie | Upsert attendance (incl. mark-all-present) |
| `/fees` | Month summary (expected / collected / pending / overdue), student table, recent payments | Record payment, send reminders |
| `/homework` | Cards filtered by batch / subject / status | Create, update, toggle status, delete, “share with parents” |
| `/exams` | Exam cards + class average / highest / pass rate, score chart, result cards | Create exam (seeds null marks), save marks, delete |
| `/teachers` | Cards with batches, student count, payroll total | Create, update, toggle active/on-leave, delete |
| `/parents` | Preview of parent phone view; announcement list | Publish announcement, send portal invite |
| `/settings` | Centre profile, fee rules, classes/subjects tags, alert toggles | PATCH settings, logout |
| App shell | Global search (students, batches, teachers, pages), notification bell, activity | Mark notifications read |

### 1.2 Parent screens → backend needs

| UI route | Reads | Writes |
|---|---|---|
| `/parent/login` | Lookup by phone/email | Send OTP, verify OTP, password login, forgot password, demo |
| `/parent` | Child summary: attendance %, fee status, pending homework, last result, next class, today classes, announcements | — |
| `/parent/attendance` | Overall %, month calendar, 4-month trend, recent absences | — |
| `/parent/fees` | Current month status, 6-month ledger, receipts | “Pay by UPI” (intent), “pay at centre” (notify staff) |
| `/parent/homework` | Pending / completed / all for child's batch | — |
| `/parent/exams` | Results with rank & class average, progress chart, printable card | — |
| `/parent/schedule` | Weekly timetable (child's batch + same className) | — |
| `/parent/child` | Profile, subjects, performance, teacher contact | — |
| `/parent/notifications` | Derived feed (fees, absences, homework, results, announcements) | — |
| `/parent/profile` | Account, linked children, alert prefs, centre contact | Update name/phone/email, toggle alerts, switch active child, logout |

---

## 2. Recommended stack

Keep this a straightforward REST API. Suggested (not mandatory):

- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** NestJS or Fastify (Express is fine)
- **ORM:** Prisma
- **DB:** PostgreSQL
- **Auth:** JWT access token (15–30 min) + httpOnly refresh cookie, or session cookies
- **OTP:** SMS/email provider later; for MVP store hashed OTP with TTL
- **Receipt numbers:** sequential per centre (`RCPT-1041…`)
- **IDs:** UUID (`cuid` / `uuid v7`)

Base URL: `https://api.tuitionos.example/v1`

---

## 3. Multi-tenancy and auth model

### Tenancy

Every business row has `centreId`. Resolve it from the authenticated staff user. Never accept `centreId` from the client body.

### Roles

| Role | Access |
|---|---|
| `owner` | Full CRUD for their centre |
| `teacher` | Same as owner for MVP (UI already treats them as staff). Later restrict payroll, settings, delete. |
| `parent` | Separate token type. Only `/v1/parent/*`. Scoped to `parentAccount.studentIds`. |

### Tokens

```
Authorization: Bearer <access_token>
```

Staff JWT claims: `{ sub, centreId, role, typ: "staff" }`  
Parent JWT claims: `{ sub, centreId, parentAccountId, typ: "parent" }`

### Password rules (from UI)

- Staff register: minimum **8** characters
- Parent password login: minimum **4** characters (UI); recommend enforcing 8 on the backend and updating the UI later

---

## 4. Domain model

Map 1:1 from `src/data/types.ts`, plus tenancy and a few tables the UI implies but does not persist.

### 4.1 Enums

```
StudentStatus     = active | inactive
TeacherStatus     = active | on-leave
BatchStatus       = active | archived
FeeStatus         = paid | pending | overdue          # computed, not stored
AttendanceMark    = present | absent
PaymentMethod     = Cash | UPI | Bank Transfer | Cheque
HomeworkStatus    = pending | completed
AnnouncementAudience = all | <batchId>
ActivityType      = fee | student | attendance | homework | exam | batch
Gender            = Male | Female
StaffRole         = owner | teacher
NotificationKind  = fee | attendance | homework | exam | announcement | system
```

### 4.2 Tables

**centres**

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | string | UI: `centreName` |
| ownerName, ownerEmail, ownerPhone | string | |
| address, city, gstin | string | Printed on receipts |
| academicYear | string | e.g. `2026-27` |
| currency | string | default `INR` |
| feeDueDay | int | 1–28, default 5 |
| lateFeeAmount | int | default 100 |
| reminderDaysBefore | int | default 3 |
| notifyFeeDue, notifyAbsent, notifyExamResults, notifyHomework, weeklyReport | bool | |
| classes | string[] | Academic tag list |
| subjects | string[] | Academic tag list |
| createdAt, updatedAt | timestamptz | |

**users** (staff)

| Column | Type |
|---|---|
| id, centreId, name, email unique, passwordHash, role, createdAt |

**teachers**

Faculty directory is a **separate** entity from `users` in the current UI (a teacher can exist without a login). Keep it that way for MVP.

| Column | Type |
|---|---|
| id, centreId, name, phone, email, subjects[], qualification, joiningDate, status, monthlySalary |

**batches**

| Column | Type |
|---|---|
| id, centreId, name, className, subject, teacherId FK, days[] (`Mon`…`Sun`), startTime (`HH:mm`), endTime, room, status |

**students**

| Column | Type |
|---|---|
| id, centreId, name, phone, parentName, parentPhone, className, batchId FK, subjects[], joiningDate, monthlyFee, status, gender, address |

**parent_accounts**

| Column | Type |
|---|---|
| id, centreId, name, phone, email, passwordHash nullable, studentIds[], notifyFees, notifyAttendance, notifyHomework, notifyResults, notifyAnnouncements |

When a student is created, upsert a parent account by `parentPhone` (same centre) and append `studentId`.

**attendance_sessions**

| Column | Type |
|---|---|
| id, centreId, batchId, date (`YYYY-MM-DD`) unique together |

**attendance_entries**

| Column | Type |
|---|---|
| id, sessionId, studentId, mark |

**fee_payments**

| Column | Type |
|---|---|
| id, centreId, studentId, month (`YYYY-MM`), amount, paidOn, method, receiptNo unique per centre, note |

**homework**

| Column | Type |
|---|---|
| id, centreId, batchId, subject, title, description, assignedOn, dueDate, status |

**homework_submissions** (optional, UI “student view” currently fakes completion with `i % 3`)

| Column | Type |
|---|---|
| homeworkId, studentId, status `pending \| completed` |

**exams**

| Column | Type |
|---|---|
| id, centreId, name, batchId, subject, date, maxMarks |

**exam_results**

| Column | Type |
|---|---|
| examId, studentId, marks nullable |

**announcements**

| Column | Type |
|---|---|
| id, centreId, title, body, audience (`all` or batchId), pinned, createdAt |

**activities**

| Column | Type |
|---|---|
| id, centreId, type, message, createdAt | Keep last 25 for dashboard |

**otps**

| Column | Type |
|---|---|
| id, centreId, contact, codeHash, purpose (`parent_login` \| `parent_reset` \| `staff_reset`), expiresAt, consumedAt |

**staff_notifications** (bell in AppShell)

| Column | Type |
|---|---|
| id, centreId, userId nullable, title, detail, tone, readAt, createdAt |

---

## 5. Business rules the UI already encodes

Implement these on the server so the frontend can stop recomputing them.

### Fee status (`studentFeeStatus`)

For student S and month `YYYY-MM`, due day D (from settings):

1. If a payment exists for `(studentId, month)` → **paid**
2. Else if `month < currentMonth` **or** (`month == currentMonth` and today.day > D) → **overdue**
3. Else → **pending**

Expected collection for a month = sum of `monthlyFee` of **active** students.  
Collected = sum of payments for that month.  
Pending amount = `max(0, expected - collected)`.

### Attendance %

Student: present entries / all entries for that student.  
Batch: present entries / all entries in sessions of that batch.  
Today summary: sessions where `date = today`.

### Exam stats (`examStats`)

Ignore null marks. Average, highest, lowest, count.  
**Pass** = marks / maxMarks ≥ **0.35**.

### Classes on a date

Active batches whose `days` include the weekday of that date (`Mon`…`Sun`). Sort by `startTime`.

Upcoming classes: same, for the next N days (dashboard uses 3, batch detail uses 7).

### Parent schedule

Batches that are active **and** (`id == child.batchId` **or** `className == child.className`).

### Parent notifications (derived)

Build a feed from: current-month fee (paid vs due/overdue), last 4 absences, last 4 homework, last 3 published results, announcements where `audience` is `all` or the child's `batchId`. Sort by date desc.

### Activity log

On create/update/delete of students, batches, attendance, payments, homework, exams, announcements, append an activity. Cap at 25 per centre for the dashboard.

### Receipt numbers

`RCPT-{n}` sequential per centre. Never reuse.

### Attendance upsert

One session per `(batchId, date)`. Saving again **replaces** entries.

---

## 6. Conventions

### Request / response

JSON. Dates are `YYYY-MM-DD`. Months are `YYYY-MM`. Times are `HH:mm` 24h.

```json
{ "data": { }, "meta": { "page": 1, "pageSize": 20, "total": 0 } }
```

Errors:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Student name is required", "fields": { "name": "required" } } }
```

| HTTP | When |
|---|---|
| 400 | Validation |
| 401 | Missing / invalid token |
| 403 | Wrong role or other centre |
| 404 | Not found in this centre |
| 409 | Duplicate (e.g. already paid that month) |

### Query params used across list endpoints

`q`, `page`, `pageSize`, plus resource filters listed below.

---

## 7. Full endpoint list

Prefix: `/v1`  
Auth: **S** = staff JWT, **P** = parent JWT, **Pub** = none.

---

### 7.1 Staff auth — `/auth`

| Method | Path | Auth | UI action |
|---|---|---|---|
| `POST` | `/auth/register` | Pub | Register tab: create centre + owner user, return tokens |
| `POST` | `/auth/login` | Pub | Email + password. Body may include `rememberMe` |
| `POST` | `/auth/demo` | Pub | “Explore the demo centre” |
| `POST` | `/auth/forgot-password` | Pub | Send reset link (expires 30 min — UI copy) |
| `POST` | `/auth/reset-password` | Pub | `{ token, password }` |
| `POST` | `/auth/logout` | S | Invalidate refresh token |
| `GET` | `/auth/me` | S | Current user + centreName + role |

**POST `/auth/register`**

```json
{
  "centreName": "Vidya Classes",
  "ownerName": "Anil Kumar",
  "email": "anil@vidyaclasses.in",
  "password": "demo1234"
}
```

Seed the new centre with default `classes` (Class 6–12) and `subjects` (Mathematics, Science, Physics, Chemistry, Biology, English, Social Science, Computer Science).

**POST `/auth/login`**

```json
{ "email": "anil@vidyaclasses.in", "password": "demo1234", "rememberMe": true }
```

**Response (register / login / demo / me)**

```json
{
  "data": {
    "user": {
      "id": "u1",
      "name": "Anil Kumar",
      "email": "anil@vidyaclasses.in",
      "centreName": "Vidya Classes",
      "role": "owner"
    },
    "accessToken": "…",
    "expiresIn": 1800
  }
}
```

---

### 7.2 Dashboard — `/dashboard`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/dashboard` | S | Entire `/` page in one round-trip |

Query: none (uses server “today” in centre timezone; default `Asia/Kolkata`).

**Response (shape the dashboard already computes)**

```json
{
  "data": {
    "centreName": "Vidya Classes",
    "month": "2026-08",
    "stats": {
      "activeStudents": 24,
      "inactiveStudents": 2,
      "activeBatches": 6,
      "classesToday": 3,
      "feesCollected": 46800,
      "feesExpected": 52000,
      "collectionRate": 90,
      "feesPending": 5200,
      "overdueCount": 4,
      "homeworkPending": 3,
      "examsThisTerm": 5
    },
    "todayAttendance": { "present": 18, "total": 22, "batches": 3, "percent": 82 },
    "collectionTrend": [
      { "month": "2026-04", "label": "Apr", "collected": 38000 }
    ],
    "attendanceTrend": [
      { "date": "2026-08-10", "day": "10 Aug", "percent": 88 }
    ],
    "todayClasses": [ { "id": "b1", "name": "X-A Maths Morning", "subject": "Mathematics", "teacherName": "Ramesh Iyer", "room": "Room 1", "startTime": "07:00", "endTime": "08:30" } ],
    "upcomingClasses": [ { "date": "2026-08-17", "batch": { "id": "b1", "name": "…", "startTime": "07:00" } } ],
    "overdueStudents": [ { "id": "s1", "name": "Aarav Sharma", "className": "Class 10", "parentPhone": "+91 …", "monthlyFee": 1800 } ],
    "activities": [ { "id": "ac1", "type": "fee", "message": "…", "time": "10 min ago", "createdAt": "…" } ]
  }
}
```

Also expose the same pieces separately if the client prefers:

| Method | Path | Notes |
|---|---|---|
| `GET` | `/activities` | `?limit=25` |
| `GET` | `/search` | `?q=` — students, batches, teachers for ⌘K |

**GET `/search?q=aarav`**

```json
{
  "data": {
    "students": [{ "id": "s1", "name": "Aarav Sharma", "className": "Class 10" }],
    "batches": [{ "id": "b1", "name": "X-A Maths Morning", "subject": "Mathematics" }],
    "teachers": [{ "id": "t1", "name": "Ramesh Iyer", "subjects": ["Mathematics"] }]
  }
}
```

---

### 7.3 Students — `/students`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/students` | S | List + filters |
| `GET` | `/students/:id` | S | Profile page (include nested summaries) |
| `POST` | `/students` | S | Add student modal |
| `PATCH` | `/students/:id` | S | Edit student modal |
| `DELETE` | `/students/:id` | S | Confirm delete |
| `POST` | `/students/:id/remind-fee` | S | “Remind” on profile |

**GET `/students` query**

| Param | Values |
|---|---|
| `q` | Matches name, phone, parentName, parentPhone |
| `className` | e.g. `Class 10` |
| `batchId` | uuid |
| `status` | `active` \| `inactive` |
| `page`, `pageSize` | |

Each list row should include computed fields the table shows:

```json
{
  "id": "s1",
  "name": "Aarav Sharma",
  "phone": "+91 …",
  "parentName": "Suresh Sharma",
  "parentPhone": "+91 …",
  "className": "Class 10",
  "batchId": "b1",
  "batchName": "X-A Maths Morning",
  "subjects": ["Mathematics", "English"],
  "joiningDate": "2026-04-12",
  "monthlyFee": 1800,
  "status": "active",
  "gender": "Male",
  "address": "12, Indiranagar",
  "attendancePercent": 88,
  "feeStatus": "overdue"
}
```

**POST / PATCH body** (all fields from `StudentFormModal`)

```json
{
  "name": "Aarav Sharma",
  "phone": "+91 98765 43210",
  "parentName": "Suresh Sharma",
  "parentPhone": "+91 98765 00000",
  "className": "Class 10",
  "batchId": "b1",
  "subjects": ["Mathematics", "English"],
  "joiningDate": "2026-04-12",
  "monthlyFee": 1800,
  "status": "active",
  "gender": "Male",
  "address": "12, Indiranagar"
}
```

Validation: `name` required. On create, upsert parent account by `parentPhone`.

**GET `/students/:id` extra payload**

```json
{
  "data": {
    "student": { },
    "batch": { "id": "b1", "name": "…", "days": ["Mon"], "startTime": "07:00", "endTime": "08:30", "room": "Room 1", "teacherName": "…" },
    "attendance": {
      "percent": 88,
      "presentCount": 20,
      "total": 23,
      "recent": [{ "id": "a1", "date": "2026-08-14", "mark": "present" }]
    },
    "payments": [{ "id": "f1", "month": "2026-08", "amount": 1800, "paidOn": "…", "method": "UPI", "receiptNo": "RCPT-1101" }],
    "feeStatus": "paid",
    "feesPaidTotal": 5400,
    "homework": [],
    "examResults": [{ "examId": "e1", "name": "Monthly Test", "subject": "Mathematics", "date": "…", "marks": 42, "maxMarks": 50 }],
    "averageScorePercent": 78
  }
}
```

---

### 7.4 Batches — `/batches`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/batches` | S | Grid + today's / upcoming |
| `GET` | `/batches/:id` | S | Detail + roster |
| `POST` | `/batches` | S | Create modal |
| `PATCH` | `/batches/:id` | S | Edit modal |
| `DELETE` | `/batches/:id` | S | Confirm delete |
| `GET` | `/batches/schedule` | S | `?from=&to=` today's + upcoming classes |

**GET `/batches` query:** `q` (name, subject, className), `status`

List item extras: `teacherName`, `studentCount`, `attendancePercent`.

**POST / PATCH body** (`BatchFormModal`)

```json
{
  "name": "X-A Maths Morning",
  "className": "Class 10",
  "subject": "Mathematics",
  "teacherId": "t1",
  "days": ["Mon", "Wed", "Fri"],
  "startTime": "07:00",
  "endTime": "08:30",
  "room": "Room 1",
  "status": "active"
}
```

Validation: `name` required, at least one day.

**GET `/batches/:id` extras:** roster (with each student's attendance % and fee), homework, exams, upcoming (7 days), `monthlyRevenue` (sum of roster monthlyFee), `isToday`.

---

### 7.5 Teachers — `/teachers`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/teachers` | S | Directory + payroll total |
| `GET` | `/teachers/:id` | S | (future profile; list cards already show batches) |
| `POST` | `/teachers` | S | Add teacher |
| `PATCH` | `/teachers/:id` | S | Edit / mark on-leave |
| `DELETE` | `/teachers/:id` | S | Remove |

**GET query:** `q` (name, subjects, phone)

List extras: `batches[]` `{ id, name, startTime }`, `studentCount`.  
Meta: `{ total, activeCount, onLeaveCount, monthlyPayroll }`.

**POST / PATCH body**

```json
{
  "name": "Anjali Deshmukh",
  "phone": "+91 98765 43210",
  "email": "anjali@tuitionos.in",
  "subjects": ["Mathematics"],
  "qualification": "M.Sc. Mathematics, B.Ed.",
  "joiningDate": "2026-06-01",
  "status": "active",
  "monthlySalary": 25000
}
```

Validation: `name` and `phone` required.

---

### 7.6 Attendance — `/attendance`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/attendance/summary` | S | Today's stats on attendance page |
| `GET` | `/attendance` | S | Session for batch+date + roster marks + history |
| `PUT` | `/attendance` | S | Save (upsert) |

**GET `/attendance/summary`**

```json
{
  "data": {
    "date": "2026-08-16",
    "present": 18,
    "total": 22,
    "percent": 82,
    "batchesMarked": 3,
    "batchesTotal": 6,
    "absent": 4
  }
}
```

**GET `/attendance?batchId=&date=`**

```json
{
  "data": {
    "session": { "id": "a1", "batchId": "b1", "date": "2026-08-16", "saved": true },
    "roster": [
      { "studentId": "s1", "name": "Aarav Sharma", "mark": "present", "overallPercent": 88 }
    ],
    "history": [
      { "id": "a0", "date": "2026-08-14", "present": 9, "total": 10, "percent": 90 }
    ],
    "batchAttendancePercent": 91
  }
}
```

If no session exists, still return roster with default `mark: "present"` (matches UI).

**PUT `/attendance`**

```json
{
  "batchId": "b1",
  "date": "2026-08-16",
  "entries": [
    { "studentId": "s1", "mark": "present" },
    { "studentId": "s2", "mark": "absent" }
  ]
}
```

If settings.`notifyAbsent` is true, enqueue absence alerts to parents of newly absent students.

History length on the page is 12; return `historyLimit=12` by default.

---

### 7.7 Fees — `/fees`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/fees/summary` | S | Dashboard + fees page KPIs |
| `GET` | `/fees/students` | S | Student fee table for a month |
| `GET` | `/fees/payments` | S | Payment history |
| `GET` | `/fees/payments/:id` | S | Receipt dialog |
| `POST` | `/fees/payments` | S | Record payment modal |
| `POST` | `/fees/reminders` | S | “Send reminders” |

**GET `/fees/summary?month=2026-08`**

```json
{
  "data": {
    "month": "2026-08",
    "feeDueDay": 5,
    "activeStudents": 24,
    "expected": 52000,
    "collected": 46800,
    "pending": 5200,
    "collectionRate": 90,
    "paidCount": 20,
    "pendingCount": 2,
    "overdueCount": 2
  }
}
```

**GET `/fees/students?month=&status=paid|pending|overdue&q=`**

Each row: student fields + `feeStatus` + `payment` (or null).

**GET `/fees/payments?limit=8`** — recent, newest `paidOn` first. Include `studentName`.

**POST `/fees/payments`**

```json
{
  "studentId": "s1",
  "month": "2026-08",
  "amount": 1800,
  "method": "UPI",
  "paidOn": "2026-08-16",
  "note": "Paid via GPay, reference 8823"
}
```

Validation: `studentId` required, `amount > 0`, `method` in enum.  
Server generates `receiptNo`.  
409 if that student already paid that month (UI currently allows duplicates — prefer 409 and document it).

Response = full `FeePayment` (receipt dialog consumes it immediately).

**POST `/fees/reminders`**

```json
{ "month": "2026-08" }
```

Sends to parents of overdue students. Response: `{ sent: 8 }`.

---

### 7.8 Homework — `/homework`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/homework` | S | Cards + stats |
| `GET` | `/homework/:id` | S | Student view dialog (roster + per-student status) |
| `POST` | `/homework` | S | Add modal |
| `PATCH` | `/homework/:id` | S | Edit / mark completed / reopen |
| `DELETE` | `/homework/:id` | S | Delete |
| `POST` | `/homework/:id/share` | S | “Share with parents” |

**GET query:** `batchId`, `subject`, `status` (`pending` \| `completed`)

Meta: `{ total, pending, completed, overdue }` where overdue = pending and `dueDate < today`.

**POST / PATCH body** (`HomeworkFormModal`)

```json
{
  "batchId": "b1",
  "subject": "Mathematics",
  "title": "Quadratic Equations - Ex 4.3",
  "description": "Solve all questions from Exercise 4.3",
  "assignedOn": "2026-08-15",
  "dueDate": "2026-08-18",
  "status": "pending"
}
```

Validation: `title` required.

**GET `/homework/:id` extras:** batch name, student count, `students: [{ id, name, submissionStatus }]`.

---

### 7.9 Exams — `/exams`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/exams` | S | Cards with stats |
| `GET` | `/exams/:id` | S | Chart + result cards for selected exam |
| `POST` | `/exams` | S | Create exam |
| `PUT` | `/exams/:id/marks` | S | Save marks |
| `DELETE` | `/exams/:id` | S | Delete exam + results |

**POST body**

```json
{
  "name": "Monthly Test - September",
  "batchId": "b1",
  "subject": "Mathematics",
  "date": "2026-09-05",
  "maxMarks": 50
}
```

On create, insert `exam_results` rows for every **active** student in the batch with `marks: null`. Return the exam so the UI can open the marks dialog.

**PUT `/exams/:id/marks`**

```json
{
  "results": [
    { "studentId": "s1", "marks": 42 },
    { "studentId": "s2", "marks": null }
  ]
}
```

If settings.`notifyExamResults` is true, notify parents of students with non-null marks.

**GET `/exams/:id` extras** (`examStats` + chart rows)

```json
{
  "stats": {
    "average": 36.2,
    "averagePct": 72.4,
    "highest": 48,
    "lowest": 22,
    "count": 10,
    "passRate": 90
  },
  "results": [
    { "studentId": "s1", "studentName": "Aarav Sharma", "marks": 42, "percent": 84, "rank": 2 }
  ]
}
```

Pass threshold: **35%**.

---

### 7.10 Announcements (staff Parents page) — `/announcements`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/announcements` | S | Composer right-hand list |
| `POST` | `/announcements` | S | Publish to parents |
| `DELETE` | `/announcements/:id` | S | Store already has delete |

**POST body**

```json
{
  "title": "Diwali holiday notice",
  "body": "The centre will remain closed on 20 Oct.",
  "audience": "all",
  "pinned": false
}
```

`audience` is `"all"` or a batch id. Title and body required.

---

### 7.11 Parent accounts (staff) — `/parents`

The staff Parents page is mostly a **preview**. Still persist accounts so the portal works.

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/parents` | S | Directory (future; preview uses students today) |
| `GET` | `/parents/:id` | S | |
| `POST` | `/parents` | S | Manual create if needed |
| `PATCH` | `/parents/:id` | S | Link extra `studentIds` |
| `POST` | `/parents/:id/invite` | S | “Send invite” (WhatsApp placeholder) |
| `GET` | `/parents/preview/:studentId` | S | Phone-frame preview payload |

**GET `/parents/preview/:studentId`** — attendance %, current-month fee paid/pending, last 4 homework, last 4 results with class avg, teacher name/phone.

---

### 7.12 Settings — `/settings`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/settings` | S | All four tabs |
| `PATCH` | `/settings` | S | Save changes |

**PATCH body** (partial `CentreSettings`)

```json
{
  "centreName": "Vidya Classes",
  "ownerName": "Anil Kumar",
  "ownerEmail": "anil@vidyaclasses.in",
  "ownerPhone": "+91 98860 45120",
  "address": "2nd Floor, Shanti Complex",
  "city": "Bengaluru",
  "gstin": "29ABCDE1234F1Z5",
  "academicYear": "2026-27",
  "currency": "INR",
  "feeDueDay": 5,
  "lateFeeAmount": 100,
  "reminderDaysBefore": 3,
  "notifyFeeDue": true,
  "notifyAbsent": true,
  "notifyExamResults": true,
  "notifyHomework": false,
  "weeklyReport": true,
  "classes": ["Class 6", "Class 7"],
  "subjects": ["Mathematics", "Science"]
}
```

`feeDueDay` clamp 1–28. Classes/subjects are the tag editors.

---

### 7.13 Staff notifications — `/notifications`

| Method | Path | Auth | UI |
|---|---|---|---|
| `GET` | `/notifications` | S | Bell popover |
| `POST` | `/notifications/read-all` | S | “Mark all as read” |
| `PATCH` | `/notifications/:id/read` | S | Optional per-item |

---

### 7.14 Parent auth — `/parent/auth`

| Method | Path | Auth | UI |
|---|---|---|---|
| `POST` | `/parent/auth/otp/send` | Pub | Send OTP (and resend) |
| `POST` | `/parent/auth/otp/verify` | Pub | Verify 4-digit OTP + sign in |
| `POST` | `/parent/auth/login` | Pub | Password tab |
| `POST` | `/parent/auth/forgot-password` | Pub | Reset link + OTP |
| `POST` | `/parent/auth/demo` | Pub | “Use demo parent” |
| `POST` | `/parent/auth/logout` | P | Sign out |
| `GET` | `/parent/auth/me` | P | Session + children list |

Lookup contact by **last 10 digits of phone** or **exact email**, same as `findAccount` in `parent.login.tsx`.

**POST `/parent/auth/otp/send`**

```json
{ "contact": "+91 98765 43210" }
```

404-style message if not registered: *“This number is not registered. Please contact the tuition centre.”*

**POST `/parent/auth/otp/verify`**

```json
{ "contact": "+91 98765 43210", "otp": "1234" }
```

**POST `/parent/auth/login`**

```json
{ "contact": "aswin.raj@gmail.com", "password": "...." }
```

**GET `/parent/auth/me`**

```json
{
  "data": {
    "parent": { "id": "p1", "name": "Aswin Raj", "phone": "+91 …", "email": "…" },
    "children": [
      { "id": "s1", "name": "Aarav Sharma", "className": "Class 10", "batchName": "X-A Maths Morning" }
    ],
    "centre": { "name": "Vidya Classes", "phone": "+91 …", "address": "…", "city": "Bengaluru" }
  }
}
```

---

### 7.15 Parent portal — `/parent/*`

All **P**. Always scoped to the token's children. Query `?studentId=` when the parent has multiple children (active child in the UI). If omitted, use the first linked child.

| Method | Path | UI page |
|---|---|---|
| `GET` | `/parent/dashboard` | `/parent` |
| `GET` | `/parent/attendance` | `/parent/attendance` |
| `GET` | `/parent/fees` | `/parent/fees` |
| `GET` | `/parent/fees/payments/:id` | Receipt dialog |
| `POST` | `/parent/fees/pay-upi` | “Pay by UPI” — returns payment link / records intent |
| `POST` | `/parent/fees/pay-at-centre` | Notify staff the parent will pay cash |
| `GET` | `/parent/homework` | `/parent/homework` |
| `GET` | `/parent/exams` | `/parent/exams` |
| `GET` | `/parent/exams/result-card` | Printable card payload |
| `GET` | `/parent/schedule` | `/parent/schedule` |
| `GET` | `/parent/child` | `/parent/child` |
| `GET` | `/parent/notifications` | `/parent/notifications` |
| `GET` | `/parent/profile` | `/parent/profile` |
| `PATCH` | `/parent/profile` | Save name / phone / email |
| `PATCH` | `/parent/profile/alerts` | Toggle notify* switches |

**GET `/parent/dashboard?studentId=`**

```json
{
  "data": {
    "child": { "id": "s1", "name": "…", "className": "Class 10", "batchName": "…" },
    "attendancePercent": 88,
    "feeStatus": "overdue",
    "monthlyFee": 1800,
    "pendingHomeworkCount": 2,
    "latestResult": { "examName": "Monthly Test", "subject": "Mathematics", "marks": 42, "maxMarks": 50, "percent": 84, "classAveragePct": 72 },
    "nextClass": { "subject": "Mathematics", "day": "Mon", "isToday": true, "startTime": "07:00", "endTime": "08:30", "room": "Room 1", "teacherName": "Ramesh Iyer" },
    "todayClasses": [],
    "pendingHomework": [],
    "announcements": [],
    "teacher": { "name": "Ramesh Iyer", "phone": "+91 …" }
  }
}
```

**GET `/parent/attendance?studentId=&month=2026-08`**

```json
{
  "data": {
    "overall": { "percent": 88, "present": 20, "absent": 3, "total": 23 },
    "month": {
      "month": "2026-08",
      "present": 8,
      "total": 10,
      "days": [{ "date": "2026-08-01", "mark": "present" }]
    },
    "trend": [{ "month": "2026-05", "label": "May", "percent": 90, "present": 12, "total": 13 }],
    "recentAbsences": [{ "date": "2026-08-12", "mark": "absent" }]
  }
}
```

`days` only needs dates that have a class (calendar empty cells are computed on the client, or send `mark: null` for no-class days).

**GET `/parent/fees?studentId=`** — 6-month ledger:

```json
{
  "data": {
    "monthlyFee": 1800,
    "lateFeeAmount": 100,
    "current": { "month": "2026-08", "status": "overdue", "dueDate": "2026-08-05", "payment": null },
    "paidTotal": 3600,
    "pendingTotal": 3600,
    "pendingMonths": 2,
    "ledger": [
      {
        "month": "2026-08",
        "amount": 1800,
        "dueDate": "2026-08-05",
        "status": "overdue",
        "payment": null
      }
    ],
    "centrePhone": "+91 …"
  }
}
```

**POST `/parent/fees/pay-upi`** `{ "studentId", "month" }` — MVP: create a pending intent and return `{ message: "Payment link sent to your mobile number." }`. Do not build a payment gateway yet (product constraint).

**POST `/parent/fees/pay-at-centre`** `{ "studentId", "month" }` — create a staff notification.

**GET `/parent/homework?studentId=&status=pending|completed|all`**

Include overdue flag (`status == pending && dueDate < today`).

**GET `/parent/exams?studentId=`**

Each result: marks, percent, classAverage, classAveragePct, rank, outOf, aboveAverage bool. Plus `{ averagePercent, bestPercent }`.

**GET `/parent/schedule?studentId=`**

```json
{
  "data": {
    "today": "Mon",
    "days": [
      {
        "day": "Mon",
        "classes": [
          { "batchId": "b1", "subject": "Mathematics", "className": "Class 10", "startTime": "07:00", "endTime": "08:30", "room": "Room 1", "teacherName": "Ramesh Iyer" }
        ]
      }
    ]
  }
}
```

**GET `/parent/child?studentId=`** — profile fields, subjects, attendance summary, exam average, batch + teacher (qualification, phone).

**GET `/parent/notifications?studentId=&kind=fee|attendance|homework|exam|announcement`**

```json
{
  "data": [
    { "id": "n-fee-f1", "kind": "fee", "title": "Fee payment received", "body": "…", "date": "2026-08-04" }
  ]
}
```

**PATCH `/parent/profile`**

```json
{ "name": "Aswin Raj", "phone": "+91 98765 43210", "email": "aswin.raj@gmail.com" }
```

**PATCH `/parent/profile/alerts`**

```json
{
  "notifyFees": true,
  "notifyAttendance": true,
  "notifyHomework": true,
  "notifyResults": true,
  "notifyAnnouncements": true
}
```

---

## 8. Endpoint index (quick copy)

Staff / public:

```
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/demo
POST   /v1/auth/forgot-password
POST   /v1/auth/reset-password
POST   /v1/auth/logout
GET    /v1/auth/me

GET    /v1/dashboard
GET    /v1/activities
GET    /v1/search

GET    /v1/students
POST   /v1/students
GET    /v1/students/:id
PATCH  /v1/students/:id
DELETE /v1/students/:id
POST   /v1/students/:id/remind-fee

GET    /v1/batches
POST   /v1/batches
GET    /v1/batches/schedule
GET    /v1/batches/:id
PATCH  /v1/batches/:id
DELETE /v1/batches/:id

GET    /v1/teachers
POST   /v1/teachers
GET    /v1/teachers/:id
PATCH  /v1/teachers/:id
DELETE /v1/teachers/:id

GET    /v1/attendance/summary
GET    /v1/attendance
PUT    /v1/attendance

GET    /v1/fees/summary
GET    /v1/fees/students
GET    /v1/fees/payments
GET    /v1/fees/payments/:id
POST   /v1/fees/payments
POST   /v1/fees/reminders

GET    /v1/homework
POST   /v1/homework
GET    /v1/homework/:id
PATCH  /v1/homework/:id
DELETE /v1/homework/:id
POST   /v1/homework/:id/share

GET    /v1/exams
POST   /v1/exams
GET    /v1/exams/:id
PUT    /v1/exams/:id/marks
DELETE /v1/exams/:id

GET    /v1/announcements
POST   /v1/announcements
DELETE /v1/announcements/:id

GET    /v1/parents
POST   /v1/parents
GET    /v1/parents/:id
PATCH  /v1/parents/:id
POST   /v1/parents/:id/invite
GET    /v1/parents/preview/:studentId

GET    /v1/settings
PATCH  /v1/settings

GET    /v1/notifications
POST   /v1/notifications/read-all
PATCH  /v1/notifications/:id/read
```

Parent:

```
POST   /v1/parent/auth/otp/send
POST   /v1/parent/auth/otp/verify
POST   /v1/parent/auth/login
POST   /v1/parent/auth/forgot-password
POST   /v1/parent/auth/demo
POST   /v1/parent/auth/logout
GET    /v1/parent/auth/me

GET    /v1/parent/dashboard
GET    /v1/parent/attendance
GET    /v1/parent/fees
GET    /v1/parent/fees/payments/:id
POST   /v1/parent/fees/pay-upi
POST   /v1/parent/fees/pay-at-centre
GET    /v1/parent/homework
GET    /v1/parent/exams
GET    /v1/parent/exams/result-card
GET    /v1/parent/schedule
GET    /v1/parent/child
GET    /v1/parent/notifications
GET    /v1/parent/profile
PATCH  /v1/parent/profile
PATCH  /v1/parent/profile/alerts
```

**Total: 78 endpoints.**

---

## 9. Implementation order

Build in the same order the owner uses the product:

1. **Auth + centres + settings** — staff can register and see an empty dashboard.
2. **Teachers + batches + students** — core roster.
3. **Parent accounts** — auto-link on student create; parent OTP login.
4. **Attendance** — upsert session; parent calendar.
5. **Fees + receipts + reminders** — dashboard KPIs start being real.
6. **Homework + exams** — parent homework/results.
7. **Announcements + notifications + activity log**.
8. **Aggregated dashboard / search / parent dashboard** (can be computed from the above).

Seed a demo centre matching `src/data/mock.ts` so `/auth/demo` and `/parent/auth/demo` stay useful.

---

## 10. Frontend swap notes

Today the UI reads `useStore()`. When the API exists:

- Replace store mutations with React Query mutations against the endpoints above.
- Keep `src/data/types.ts` as the shared DTO shapes (they already match).
- Move `feeSummary`, `studentFeeStatus`, `examStats`, `parentNotifications` to the server (section 5) so list pages do not over-fetch.
- Client-only: date formatting, INR display, calendar blank cells, print receipt / result card.
- Placeholders that stay out of scope for MVP (per original product notes): WhatsApp delivery, payment gateway, online classes, AI.

---

## 11. Source files this spec is based on

| Area | Files |
|---|---|
| Types / mock | `src/data/types.ts`, `src/data/mock.ts` |
| Client “backend” | `src/store/tuition-store.tsx`, `src/store/auth.tsx`, `src/store/parent-auth.tsx` |
| Derived logic | `src/lib/selectors.ts`, `src/lib/parent.ts` |
| Staff UI | `src/routes/*.tsx`, `src/components/modals/*`, `src/components/layout/AppShell.tsx` |
| Parent UI | `src/routes/parent.*.tsx`, `src/components/parent/ParentShell.tsx` |

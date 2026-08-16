# TuitionOS Hub

Create a modern responsive SaaS web application called TuitionOS, a simple management platform for tuition centres.

Build the complete frontend UI for the Admin/Owner and Teacher side using React, TypeScript, Tailwind CSS and a clean component-based architecture.

The design should feel modern, professional, simple and extremely easy for a tuition-centre owner to understand. Do NOT make it look like a complicated enterprise ERP. Use a clean education-focused dashboard with cards, tables, badges, charts and clear actions. It must work beautifully on desktop, tablet and mobile.

Create these pages and flows:

LOGIN / REGISTER

Email/password login

Register tuition centre

Forgot password UI

Demo login option

Centre name and owner profile

ADMIN DASHBOARD
Show:

Total students

Active batches

Fees collected this month

Pending fees

Today's attendance

Today's classes

Recent activities

Students with overdue fees

Upcoming classes

Quick actions:
Add Student
Create Batch
Mark Attendance
Record Fee
Add Homework

STUDENTS

Student list with search

Filter by class/batch/status

Add student

Edit student

Delete student

Student profile page

Student details:
name, phone, parent name, parent phone, class, batch, subjects, joining date, monthly fee

Attendance percentage

Fee status

Recent homework

Recent exam results

BATCHES / CLASSES

Batch list

Create batch

Edit batch

Batch details

Teacher

Subject

Class

Schedule

Student count

Student list

Today's classes

Upcoming classes

ATTENDANCE

Select batch and date

Show students in that batch

Present/Absent controls

Mark all present

Save attendance

Attendance history

Attendance percentage

Visual attendance summary

FEES

Monthly fee dashboard

Total expected

Total collected

Total pending

Paid/pending/overdue status

Student fee table

Record payment

Payment history

Filter by month/status

Student payment details

Generate a clean payment receipt UI

HOMEWORK

Create homework

Select batch/subject

Set title, description and due date

Homework list

Pending/completed status

Student homework view

Filter by batch and subject

EXAMS & RESULTS

Create exam

Select batch and subject

Enter student marks

Calculate percentage

Show class average

Student result history

Result cards and simple charts

TEACHERS

Teacher list

Add teacher

Teacher profile

Assigned batches

Subjects

Schedule

Basic teacher status

SETTINGS

Tuition centre profile

Owner profile

Notification preferences

Fee settings

Academic settings

NAVIGATION:
Use a responsive sidebar on desktop and bottom/mobile navigation on smaller screens.

Main navigation:
Dashboard
Students
Batches
Attendance
Fees
Homework
Exams
Teachers
Parents
Settings

Include a global search, notifications icon, profile menu and logout.

IMPORTANT:

The "Parents" section should appear in the navigation but can initially show a polished placeholder/overview because the detailed parent portal will be implemented in Prompt 2.

Use realistic demo data throughout the UI so the application looks fully populated.

Create reusable components for tables, cards, forms, modals, badges, charts and empty states.

Include loading, error, empty and confirmation states.

Use realistic Indian tuition-centre data and INR currency.

Do not build unnecessary features such as online classes, payments gateways, AI or WhatsApp integration yet.

Keep the architecture ready for REST API integration later.

Use mock/local data only for now. Do not create a complex backend.

Every button should have a sensible UI interaction, modal, navigation or placeholder action.

Make the entire application feel like a real production SaaS MVP rather than a template.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bae453b7-7cbf-41f5-80c1-853055d856f1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

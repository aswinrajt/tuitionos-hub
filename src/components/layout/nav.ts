import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Settings,
  Users,
  UserRound,
  Wallet,
} from "lucide-react";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/batches", label: "Batches", icon: Layers },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/fees", label: "Fees", icon: Wallet },
  { to: "/homework", label: "Homework", icon: ClipboardList },
  { to: "/exams", label: "Exams", icon: BookOpen },
  { to: "/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/parents", label: "Parents", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export const mobilePrimary = ["/", "/students", "/attendance", "/fees"] as const;

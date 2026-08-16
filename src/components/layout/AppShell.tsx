import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  Sparkles,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { navItems, mobilePrimary } from "./nav";
import { useAuth } from "@/store/auth";
import { useStore } from "@/store/tuition-store";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { toast } from "sonner";

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary font-display text-base font-bold text-sidebar-primary-foreground">
        T
      </span>
      {!compact ? (
        <span className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
          TuitionOS
        </span>
      ) : null}
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className={cn("size-4.5", active && "text-sidebar-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationsBell() {
  const { feePayments, homework } = useStore();
  const items = [
    { title: "8 students have pending fees", detail: "August 2026 collection cycle", tone: "text-destructive" },
    { title: "Homework due tomorrow", detail: `${homework.filter((h) => h.status === "pending").length} pending assignments`, tone: "text-warning-foreground" },
    { title: "Attendance not marked", detail: "XII PCM Batch — evening slot", tone: "text-info" },
    { title: `Last payment received`, detail: `${feePayments.length} receipts generated so far`, tone: "text-success" },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-sm font-semibold">Notifications</p>
        </div>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {items.map((n) => (
            <li key={n.title} className="px-4 py-3">
              <p className={cn("text-sm font-medium", n.tone)}>{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.detail}</p>
            </li>
          ))}
        </ul>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => toast.success("All notifications marked as read")}
          >
            Mark all as read
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { students, batches, teachers } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (to: string, params?: Record<string, string>) => {
    setOpen(false);
    navigate({ to, params } as never);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-input bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 md:max-w-md"
      >
        <Search className="size-4" />
        <span className="truncate">Search students, batches, teachers…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium md:inline">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a name or page…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {navItems.map((n) => (
              <CommandItem key={n.to} value={`page ${n.label}`} onSelect={() => go(n.to)}>
                <n.icon className="mr-2 size-4" />
                {n.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Students">
            {students.slice(0, 12).map((s) => (
              <CommandItem
                key={s.id}
                value={`student ${s.name} ${s.className}`}
                onSelect={() => go("/students/$studentId", { studentId: s.id })}
              >
                {s.name}
                <span className="ml-auto text-xs text-muted-foreground">{s.className}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Batches">
            {batches.map((b) => (
              <CommandItem
                key={b.id}
                value={`batch ${b.name}`}
                onSelect={() => go("/batches/$batchId", { batchId: b.id })}
              >
                {b.name}
                <span className="ml-auto text-xs text-muted-foreground">{b.subject}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Teachers">
            {teachers.map((t) => (
              <CommandItem key={t.id} value={`teacher ${t.name}`} onSelect={() => go("/teachers")}>
                {t.name}
                <span className="ml-auto text-xs text-muted-foreground">{t.subjects[0]}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 text-left transition-colors hover:bg-muted">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {initials(user.name)}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold">{user.name}</span>
            <span className="block text-xs capitalize text-muted-foreground">{user.role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{user.centreName}</p>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
          <UserCog className="mr-2 size-4" /> Profile & settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info("You are on the TuitionOS Starter plan")}>
          <Sparkles className="mr-2 size-4" /> Plan & billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            logout();
            toast.success("Logged out");
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="mr-2 size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const primary = useMemo(
    () => navItems.filter((n) => (mobilePrimary as readonly string[]).includes(n.to)),
    [],
  );
  const rest = useMemo(
    () => navItems.filter((n) => !(mobilePrimary as readonly string[]).includes(n.to)),
    [],
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {primary.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
            <MoreHorizontal className="size-5" />
            More
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetTitle className="mb-3">More</SheetTitle>
            <div className="grid grid-cols-3 gap-3 pb-4">
              {rest.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs font-medium"
                >
                  <item.icon className="size-5 text-primary" />
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen space-y-4 p-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="rounded-2xl bg-sidebar-accent/60 p-4">
          <p className="font-display text-sm font-semibold text-sidebar-accent-foreground">
            {user.centreName}
          </p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/70">Academic year 2026-27</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-0 bg-sidebar p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="mb-6 flex items-center justify-between">
                  <Brand />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-foreground"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-1.5">
              <NotificationsBell />
              <ProfileMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

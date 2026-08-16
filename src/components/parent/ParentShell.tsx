import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Home,
  LogOut,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/common/Spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParentAuth } from "@/store/parent-auth";
import { useParentMe, useParentNotifications } from "@/hooks/api";
import { CURRENT_MONTH, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const parentNav = [
  { to: "/parent", label: "Home", icon: Home },
  { to: "/parent/attendance", label: "Attendance", icon: CalendarDays },
  { to: "/parent/fees", label: "Fees", icon: Wallet },
  { to: "/parent/homework", label: "Homework", icon: ClipboardList },
  { to: "/parent/profile", label: "Profile", icon: User },
] as const;

/** Everything a parent page needs: account, children, and the selected child. */
export function useParentContext() {
  const { activeChildId, setActiveChildId } = useParentAuth();
  const me = useParentMe();

  const account = me.data?.parent ?? null;
  const children = me.data?.children ?? [];
  const child = children.find((c) => c.id === activeChildId) ?? children[0] ?? null;

  return { account, children, child, setActiveChildId };
}

function ChildSwitcher() {
  const { children, child, setActiveChildId } = useParentContext();
  if (!child) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex min-w-0 items-center gap-2.5 rounded-full bg-primary-soft py-1.5 pl-1.5 pr-3 text-left">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials(child.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight text-primary">
              {child.name}
            </span>
            <span className="block truncate text-[11px] leading-tight text-primary/80">
              {child.className}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-primary" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Switch child</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => {
              setActiveChildId(c.id);
              toast.success(`Showing ${c.name}`);
            }}
            className={cn("gap-2", c.id === child.id && "bg-accent")}
          >
            <span className="grid size-7 place-items-center rounded-full bg-secondary text-[11px] font-bold">
              {initials(c.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{c.name}</span>
              <span className="block text-xs text-muted-foreground">{c.className}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {parentNav.map((item) => {
          const active = item.to === "/parent" ? pathname === "/parent" : pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "scale-110")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ParentPageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header>
      <h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

export function ParentScreenLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-primary-soft px-4 py-3 text-primary">
        <Spinner className="size-5" />
        <p className="text-sm font-medium">Loading…</p>
      </div>
      <Skeleton className="h-10 w-48 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

export function ParentShell({ children }: { children: ReactNode }) {
  const { parent, ready, logout, activeChildId } = useParentAuth();
  const { child } = useParentContext();
  const me = useParentMe();
  const notes = useParentNotifications(child?.id ?? activeChildId);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (ready && !parent) navigate({ to: "/parent/login" });
  }, [ready, parent, navigate]);

  const unread = (notes.data ?? []).filter((n) => n.date >= CURRENT_MONTH).length;

  if (!ready || !parent || me.isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-5">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2.5">
          <ChildSwitcher />
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Link to="/parent/notifications">
                <Bell className="size-5" />
                {unread ? (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{parent.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/parent/profile" })}>
                  My profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/parent/schedule" })}>
                  Class schedule
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    void (async () => {
                      await logout();
                      qc.removeQueries({ queryKey: ["parent"] });
                      toast.success("Signed out");
                      navigate({ to: "/parent/login", replace: true });
                    })();
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}

/** Consistent empty message for parent pages. */
export function ParentEmpty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {body ? <p className="mt-1 text-sm text-muted-foreground">{body}</p> : null}
    </div>
  );
}

/** Simple white card used across parent pages. */
export function ParentCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-background p-4 shadow-sm", className)}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

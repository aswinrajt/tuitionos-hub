import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  paid: "bg-success-soft text-success",
  present: "bg-success-soft text-success",
  active: "bg-success-soft text-success",
  completed: "bg-success-soft text-success",
  pending: "bg-warning-soft text-warning-foreground",
  "on-leave": "bg-warning-soft text-warning-foreground",
  overdue: "bg-destructive-soft text-destructive",
  absent: "bg-destructive-soft text-destructive",
  inactive: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  info: "bg-info-soft text-info",
};

const labels: Record<string, string> = { "on-leave": "On leave" };

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        styles[status] ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {labels[status] ?? status}
    </span>
  );
}

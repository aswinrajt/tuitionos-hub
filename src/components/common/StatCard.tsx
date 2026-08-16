import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "destructive" | "info" | "accent";

const toneMap: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-accent-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "surface-card flex items-start gap-4 p-4 text-left transition-all sm:p-5",
        onClick && "hover:-translate-y-0.5 hover:shadow-float",
      )}
    >
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", toneMap[tone])}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 block font-display text-2xl font-semibold leading-tight">{value}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </Comp>
  );
}

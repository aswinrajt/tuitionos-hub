import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-4 shrink-0", className)} role="status" aria-label="Loading">
      <span className="absolute inset-0 rounded-full border-2 border-current/25" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-current" />
    </span>
  );
}

export function SavingOverlay({ label = "Saving…" }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-[3px]">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary shadow-float">
        <Spinner className="size-6" />
      </span>
      <p className="text-sm font-medium text-primary">{label}</p>
    </div>
  );
}

export function PageSkeleton({ cards = 4, tiles = 6 }: { cards?: number; tiles?: number }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={`c-${i}`} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: tiles }).map((_, i) => (
          <Skeleton key={`t-${i}`} className="h-64 rounded-2xl" />
        ))}
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SavingOverlay } from "@/components/common/Spinner";
import { cn } from "@/lib/utils";

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  pending = false,
  onSubmit,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  onSubmit: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showClose={!pending}
        className={cn("relative max-h-[90vh] overflow-y-auto", wide && "sm:max-w-2xl")}
        onPointerDownOutside={(e) => pending && e.preventDefault()}
        onEscapeKeyDown={(e) => pending && e.preventDefault()}
      >
        {pending ? <SavingOverlay label={pendingLabel} /> : null}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form
          id="form-modal"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (pending) return;
            onSubmit();
          }}
        >
          <fieldset disabled={pending} className="min-w-0 space-y-4 border-0 p-0">
            {children}
          </fieldset>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {pending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

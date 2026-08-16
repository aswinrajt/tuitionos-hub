import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import {
  ParentCard,
  ParentEmpty,
  ParentPageTitle,
  ParentScreenLoading,
  ParentShell,
  useParentContext,
} from "@/components/parent/ParentShell";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParentAuth } from "@/store/parent-auth";
import { useParentHomework } from "@/hooks/api";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/parent/homework")({
  head: () => ({
    meta: [
      { title: "Homework — TuitionOS Parent Portal" },
      { name: "description", content: "Every homework task the teacher assigned, with due dates and what is still pending." },
      { property: "og:title", content: "Homework — TuitionOS Parent Portal" },
      { property: "og:description", content: "Pending and completed homework with clear due dates." },
    ],
  }),
  component: ParentHomeworkPage,
});

function ParentHomeworkPage() {
  const { activeChildId } = useParentAuth();
  const { child } = useParentContext();
  const studentId = child?.id ?? activeChildId;
  const [tab, setTab] = useState<"pending" | "completed" | "all">("pending");
  const { data: all = [], isLoading } = useParentHomework(studentId);

  if (!studentId) {
    return (
      <ParentShell>
        <ParentEmpty title="No child linked" />
      </ParentShell>
    );
  }

  if (isLoading) {
    return (
      <ParentShell>
        <ParentScreenLoading />
      </ParentShell>
    );
  }

  const list = tab === "all" ? all : all.filter((h) => h.status === tab);
  const overdue = all.filter((h) => h.overdue).length;
  const firstName = (child?.name ?? "your child").split(" ")[0];

  return (
    <ParentShell>
      <ParentPageTitle title="Homework" description={`Assigned by ${firstName}'s teachers.`} />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Pending" value={all.filter((h) => h.status === "pending").length} />
        <Stat label="Overdue" value={overdue} tone="destructive" />
        <Stat label="Completed" value={all.filter((h) => h.status === "completed").length} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Done</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length ? (
        <div className="space-y-3">
          {list.map((h) => (
            <ParentCard key={h.id} className={h.overdue ? "border-destructive/40" : undefined}>
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-base font-semibold">{h.title}</p>
                    <Badge variant={h.status === "completed" ? "default" : h.overdue ? "destructive" : "secondary"}>
                      {h.status === "completed" ? "Done" : h.overdue ? "Overdue" : "Pending"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{h.subject}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{h.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Due {formatDate(h.dueDate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" /> Given {formatDate(h.assignedOn)}
                    </span>
                  </div>
                </div>
              </div>
            </ParentCard>
          ))}
        </div>
      ) : (
        <ParentEmpty
          title={tab === "pending" ? "Nothing pending" : "Nothing here yet"}
          body={tab === "pending" ? "All homework has been completed." : "Homework will appear here as teachers assign it."}
        />
      )}
    </ParentShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "destructive" }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3 text-center">
      <p className={`font-display text-xl font-semibold ${tone === "destructive" && value > 0 ? "text-destructive" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

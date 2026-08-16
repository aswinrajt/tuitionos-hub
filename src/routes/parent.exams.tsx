import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, Printer, TrendingUp } from "lucide-react";
import {
  ParentCard,
  ParentEmpty,
  ParentPageTitle,
  ParentScreenLoading,
  ParentShell,
  useParentContext,
} from "@/components/parent/ParentShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useParentAuth } from "@/store/parent-auth";
import { useParentExams, useParentResultCard } from "@/hooks/api";
import { formatDate, pct } from "@/lib/format";

export const Route = createFileRoute("/parent/exams")({
  head: () => ({
    meta: [
      { title: "Exams & results — TuitionOS Parent Portal" },
      { name: "description", content: "Marks, class average comparison and a printable result card for every published test." },
      { property: "og:title", content: "Exams & results — TuitionOS Parent Portal" },
      { property: "og:description", content: "See marks, rank and progress over time." },
    ],
  }),
  component: ParentExamsPage,
});

function ParentExamsPage() {
  const { activeChildId } = useParentAuth();
  const { child } = useParentContext();
  const studentId = child?.id ?? activeChildId;
  const { data, isLoading } = useParentExams(studentId);
  const resultCard = useParentResultCard(studentId);
  const [cardOpen, setCardOpen] = useState(false);

  if (!studentId) {
    return (
      <ParentShell>
        <ParentEmpty title="No child linked" />
      </ParentShell>
    );
  }

  if (isLoading || !data) {
    return (
      <ParentShell>
        <ParentScreenLoading />
      </ParentShell>
    );
  }

  const results = data.results;
  const avg = data.averagePercent;
  const firstName = data.childName.split(" ")[0];
  const trend = [...results].reverse().map((r) => ({
    label: r.exam.name.length > 10 ? `${r.exam.name.slice(0, 10)}…` : r.exam.name,
    score: Math.round(r.percent),
    average: Math.round(r.classAveragePct),
  }));
  const printed = resultCard.data ?? { ...data, centreName: "Tuition centre", academicYear: "" };

  return (
    <ParentShell>
      <ParentPageTitle title="Exams & results" description={`Published results for ${data.childName}.`} />

      {results.length === 0 ? (
        <ParentEmpty title="No results published yet" body="Results will appear here once teachers enter the marks." />
      ) : (
        <>
          <ParentCard>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Average score</p>
                <p className="font-display text-3xl font-semibold">{pct(avg)}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{results.length} results</p>
                {data.bestPercent ? (
                  <p className="flex items-center justify-end gap-1">
                    <Award className="size-3.5" /> Best {pct(data.bestPercent)}
                  </p>
                ) : null}
              </div>
            </div>
            <Progress value={avg} className="mt-3" />
            <Button variant="outline" className="mt-4 h-11 w-full" onClick={() => setCardOpen(true)}>
              <Printer className="mr-2 size-4" /> View result card
            </Button>
          </ParentCard>

          <ParentCard title="Progress over time">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip formatter={(v: number, name) => [`${v}%`, name === "score" ? firstName : "Class average"]} />
                  <Line type="monotone" dataKey="score" stroke="var(--color-chart-1)" strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="average" stroke="var(--color-muted-foreground)" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" /> Solid line is your child, dotted line is the class average.
            </p>
          </ParentCard>

          <div className="space-y-3">
            {results.map((r) => (
              <ParentCard key={r.exam.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold">{r.exam.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.exam.subject} · {formatDate(r.exam.date)}
                    </p>
                  </div>
                  <Badge variant={r.aboveAverage ? "default" : "secondary"}>
                    {r.aboveAverage ? "Above average" : "Below average"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="font-display text-2xl font-semibold">
                    {r.marks}
                    <span className="text-sm text-muted-foreground">/{r.exam.maxMarks}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Rank {r.rank} of {r.outOf}
                  </p>
                </div>
                <Progress value={r.percent} className="mt-2" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Class average {pct(r.classAveragePct)} · your child {pct(r.percent)}
                </p>
              </ParentCard>
            ))}
          </div>
        </>
      )}

      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Result card</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="font-display text-base font-semibold">{printed.centreName ?? "Tuition centre"}</p>
              {printed.academicYear ? (
                <p className="text-xs text-muted-foreground">Academic year {printed.academicYear}</p>
              ) : null}
            </div>
            <div>
              <p className="font-medium">{printed.childName}</p>
              <p className="text-xs text-muted-foreground">{printed.className}</p>
            </div>
            <ul className="divide-y divide-border">
              {printed.results.map((r) => (
                <li key={r.exam.id} className="flex items-center justify-between py-2">
                  <span className="min-w-0 truncate">{r.exam.subject} — {r.exam.name}</span>
                  <span className="shrink-0 font-medium">{r.marks}/{r.exam.maxMarks}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border pt-3 font-medium">
              <span>Overall</span>
              <span>{pct(printed.averagePercent)}</span>
            </div>
            <Button className="h-11 w-full" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" /> Print result card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ParentShell>
  );
}

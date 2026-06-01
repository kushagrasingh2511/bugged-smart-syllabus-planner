"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PlannerTask, StudyPlanDetail, StudyPlanListItem } from "@/types/study-plan";
import type { SubjectItem, SyllabusItem } from "@/types/syllabus";

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Request failed";
  } catch {
    return "Request failed";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dateKey(iso: string) {
  return new Date(iso).toISOString().split("T")[0];
}

function groupTasksByDate(tasks: PlannerTask[]): Record<string, PlannerTask[]> {
  const groups: Record<string, PlannerTask[]> = {};
  for (const task of tasks) {
    const key = dateKey(task.dueDate);
    (groups[key] ??= []).push(task);
  }
  return groups;
}

function statusVariant(
  status: PlannerTask["status"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed":
      return "outline";
    case "in_progress":
      return "default";
    case "missed":
      return "destructive";
    default:
      return "secondary";
  }
}

export function StudyPlanner() {
  const [plans, setPlans] = useState<StudyPlanListItem[]>([]);
  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planDetail, setPlanDetail] = useState<StudyPlanDetail | null>(null);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [actingTaskId, setActingTaskId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState("2");
  const [selectedSyllabusIds, setSelectedSyllabusIds] = useState<string[]>([]);
  const [weakSubjectIds, setWeakSubjectIds] = useState<string[]>([]);

  const loadPlans = useCallback(async () => {
    const response = await fetch("/api/study-plans");
    if (!response.ok) throw new Error(await readApiError(response));
    const body = await response.json();
    return body.data.plans as StudyPlanListItem[];
  }, []);

  const loadPlanDetail = useCallback(async (planId: string) => {
    const response = await fetch(`/api/study-plans/${planId}`);
    if (!response.ok) throw new Error(await readApiError(response));
    const body = await response.json();
    return {
      plan: body.data.plan as StudyPlanDetail,
      tasks: body.data.tasks as PlannerTask[],
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [planList, syllabusRes, subjectRes] = await Promise.all([
          loadPlans(),
          fetch("/api/syllabus"),
          fetch("/api/subjects"),
        ]);
        if (cancelled) return;
        setPlans(planList);
        if (syllabusRes.ok) {
          const sBody = await syllabusRes.json();
          const items = (sBody.data.syllabi as SyllabusItem[]).filter(
            (s) => s.extractionStatus === "completed",
          );
          setSyllabi(items);
          if (items.length === 1) {
            setSelectedSyllabusIds([items[0].syllabusId]);
          }
        }
        if (subjectRes.ok) {
          const subBody = await subjectRes.json();
          setSubjects(subBody.data.subjects as SubjectItem[]);
        }
        if (planList.length > 0) {
          setSelectedPlanId((current) => current ?? planList[0].planId);
        }
      } catch (err) {
        if (!cancelled) {
          setMessage({
            type: "error",
            text: err instanceof Error ? err.message : "Failed to load planner",
          });
        }
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPlans]);

  useEffect(() => {
    if (!selectedPlanId) {
      setPlanDetail(null);
      setTasks([]);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    loadPlanDetail(selectedPlanId)
      .then(({ plan, tasks: planTasks }) => {
        if (cancelled) return;
        setPlanDetail(plan);
        setTasks(planTasks);
        const keys = Object.keys(groupTasksByDate(planTasks));
        setExpandedDates(new Set(keys.slice(0, 3)));
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage({
            type: "error",
            text: err instanceof Error ? err.message : "Failed to load plan",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPlanId, loadPlanDetail]);

  function updatePlanCounts(planId: string, completedDelta: number) {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.planId !== planId) return p;
        const completedTasks = Math.max(0, p.completedTasks + completedDelta);
        const progress =
          p.totalTasks > 0
            ? Math.round((completedTasks / p.totalTasks) * 100)
            : 0;
        return { ...p, completedTasks, progress };
      }),
    );
    setPlanDetail((prev) => {
      if (!prev || prev.planId !== planId) return prev;
      const completedTasks = Math.max(0, prev.completedTasks + completedDelta);
      const progress =
        prev.totalTasks > 0
          ? Math.round((completedTasks / prev.totalTasks) * 100)
          : 0;
      return { ...prev, completedTasks, progress };
    });
  }

  async function handleComplete(taskId: string) {
    setActingTaskId(taskId);
    setMessage(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const body = await response.json();
      const updated = body.data.task as PlannerTask;
      const wasCompleted = tasks.find((t) => t.taskId === taskId)?.status === "completed";

      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? { ...t, ...updated } : t)),
      );
      if (!wasCompleted && updated.status === "completed" && selectedPlanId) {
        updatePlanCounts(selectedPlanId, 1);
      }
      setMessage({ type: "success", text: "Task marked complete" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not complete task",
      });
    } finally {
      setActingTaskId(null);
    }
  }

  async function handleUndo(taskId: string) {
    setActingTaskId(taskId);
    setMessage(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/undo`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const body = await response.json();
      const updated = body.data.task as PlannerTask;

      setTasks((prev) =>
        prev.map((t) => (t.taskId === taskId ? { ...t, ...updated } : t)),
      );
      if (selectedPlanId) {
        updatePlanCounts(selectedPlanId, -1);
      }
      setMessage({ type: "success", text: "Completion undone" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not undo task",
      });
    } finally {
      setActingTaskId(null);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/study-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          examDate: new Date(examDate).toISOString(),
          dailyStudyHours: Number(dailyStudyHours),
          weakSubjects: weakSubjectIds,
          syllabusIds: selectedSyllabusIds,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const body = await response.json();
      const planId = body.data.plan.planId as string;
      setShowGenerate(false);
      setTitle("");
      setExamDate("");
      setWeakSubjectIds([]);
      const list = await loadPlans();
      setPlans(list);
      setSelectedPlanId(planId);
      setMessage({
        type: "success",
        text: `Plan created with ${body.data.plan.totalTasks} tasks`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate plan",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!confirm("Delete this study plan and all its tasks?")) return;
    setDeletingPlanId(planId);
    try {
      const response = await fetch(`/api/study-plans/${planId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const list = await loadPlans();
      setPlans(list);
      if (selectedPlanId === planId) {
        setSelectedPlanId(list[0]?.planId ?? null);
      }
      setMessage({ type: "success", text: "Study plan deleted" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete plan",
      });
    } finally {
      setDeletingPlanId(null);
    }
  }

  function toggleDate(key: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const tasksByDate = groupTasksByDate(tasks);
  const sortedDateKeys = Object.keys(tasksByDate).sort();
  const readySyllabi = syllabi.length > 0;

  return (
    <div className="space-y-4">
      {message ? (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            message.type === "success"
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Generate schedules from your syllabus, then mark tasks complete as you study.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowGenerate((v) => !v)}
          disabled={!readySyllabi}
        >
          <Plus data-icon="inline-start" />
          New plan
        </Button>
      </div>

      {!readySyllabi && !loadingPlans ? (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Add and extract a syllabus first, then return here to generate a study plan.
          </CardContent>
        </Card>
      ) : null}

      {showGenerate && readySyllabi ? (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Generate study plan
            </CardTitle>
            <CardDescription>
              Tasks are spread from tomorrow until the day before your exam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plan-title">Plan title</Label>
                  <Input
                    id="plan-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midterm prep"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-date">Exam date</Label>
                  <Input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily-hours">Daily study hours</Label>
                  <Input
                    id="daily-hours"
                    type="number"
                    min={0.5}
                    max={16}
                    step={0.5}
                    value={dailyStudyHours}
                    onChange={(e) => setDailyStudyHours(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Syllabi to include</Label>
                <div className="flex flex-wrap gap-2">
                  {syllabi.map((s) => {
                    const checked = selectedSyllabusIds.includes(s.syllabusId);
                    return (
                      <button
                        key={s.syllabusId}
                        type="button"
                        onClick={() =>
                          setSelectedSyllabusIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== s.syllabusId)
                              : [...prev, s.syllabusId],
                          )
                        }
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          checked
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border hover:bg-muted",
                        )}
                      >
                        {s.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {subjects.length > 0 ? (
                <div className="space-y-2">
                  <Label>Weak subjects (optional extra focus)</Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((sub) => {
                      const checked = weakSubjectIds.includes(sub.subjectId);
                      return (
                        <button
                          key={sub.subjectId}
                          type="button"
                          onClick={() =>
                            setWeakSubjectIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== sub.subjectId)
                                : [...prev, sub.subjectId],
                            )
                          }
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                            checked
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          {sub.subjectName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={generating || selectedSyllabusIds.length === 0}>
                  {generating ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Sparkles data-icon="inline-start" />
                  )}
                  Generate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGenerate(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        <Card className="border-border/60 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loadingPlans ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No plans yet.</p>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.planId}
                  className={cn(
                    "flex items-start gap-1 rounded-lg border p-2 transition-colors",
                    selectedPlanId === plan.planId
                      ? "border-primary/50 bg-primary/5"
                      : "border-transparent hover:bg-muted/50",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setSelectedPlanId(plan.planId)}
                  >
                    <p className="truncate font-medium text-sm">{plan.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.progress}% · {plan.completedTasks}/{plan.totalTasks} tasks
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete plan"
                    disabled={deletingPlanId === plan.planId}
                    onClick={() => handleDeletePlan(plan.planId)}
                  >
                    {deletingPlanId === plan.planId ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 min-h-[320px]">
          <CardHeader>
            {planDetail ? (
              <>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4 text-primary" />
                  {planDetail.title}
                </CardTitle>
                <CardDescription>
                  Exam {formatDate(planDetail.examDate)} · {planDetail.dailyStudyHours}h/day ·{" "}
                  {planDetail.progress}% complete
                </CardDescription>
              </>
            ) : (
              <CardTitle className="text-base">Tasks</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {loadingDetail ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading tasks…
              </p>
            ) : !selectedPlanId || !planDetail ? (
              <p className="text-sm text-muted-foreground">
                Select or create a plan to view tasks.
              </p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks in this plan. Ensure your syllabus has pending topics.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedDateKeys.map((key) => {
                  const dayTasks = tasksByDate[key];
                  const open = expandedDates.has(key);
                  const dayDone = dayTasks.filter((t) => t.status === "completed").length;
                  return (
                    <div key={key} className="rounded-lg border border-border/60">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40"
                        onClick={() => toggleDate(key)}
                      >
                        {open ? (
                          <ChevronDown className="size-4 shrink-0" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0" />
                        )}
                        <span className="flex-1">{formatDate(key)}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {dayDone}/{dayTasks.length}
                        </span>
                      </button>
                      {open ? (
                        <ul className="divide-y divide-border/60 border-t border-border/60">
                          {dayTasks.map((task) => {
                            const busy = actingTaskId === task.taskId;
                            const done = task.status === "completed";
                            return (
                              <li
                                key={task.taskId}
                                className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                              >
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p
                                    className={cn(
                                      "text-sm leading-snug",
                                      done && "text-muted-foreground line-through",
                                    )}
                                  >
                                    {task.taskTitle}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <Badge variant={statusVariant(task.status)}>
                                      {task.status.replace("_", " ")}
                                    </Badge>
                                    <Badge variant="secondary">{task.priority}</Badge>
                                  </div>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  {done ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => handleUndo(task.taskId)}
                                    >
                                      {busy ? (
                                        <Loader2 className="animate-spin" />
                                      ) : (
                                        <RotateCcw data-icon="inline-start" />
                                      )}
                                      Undo
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => handleComplete(task.taskId)}
                                    >
                                      {busy ? (
                                        <Loader2 className="animate-spin" />
                                      ) : (
                                        <Check data-icon="inline-start" />
                                      )}
                                      Done
                                    </Button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  return new Date(iso).toLocaleDateString("en-US", {
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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyStudyHours, setDailyStudyHours] = useState("2");
  const [selectedSyllabusIds, setSelectedSyllabusIds] = useState<string[]>([]);
  const [weakSubjectIds, setWeakSubjectIds] = useState<string[]>([]);

  const loadPlans = useCallback(async () => {
    const r = await fetch("/api/study-plans");
    if (!r.ok) throw new Error(await readApiError(r));
    return (await r.json()).data.plans as StudyPlanListItem[];
  }, []);

  const loadPlanDetail = useCallback(async (planId: string) => {
    const r = await fetch(`/api/study-plans/${planId}`);
    if (!r.ok) throw new Error(await readApiError(r));
    const b = await r.json();
    return { plan: b.data.plan as StudyPlanDetail, tasks: b.data.tasks as PlannerTask[] };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [planList, syllabusRes, subjectRes] = await Promise.all([
          loadPlans(), fetch("/api/syllabus"), fetch("/api/subjects"),
        ]);
        if (cancelled) return;
        setPlans(planList);
        if (syllabusRes.ok) {
          const items = ((await syllabusRes.json()).data.syllabi as SyllabusItem[]).filter(
            (s) => s.extractionStatus === "completed",
          );
          setSyllabi(items);
          if (items.length === 1) setSelectedSyllabusIds([items[0].syllabusId]);
        }
        if (subjectRes.ok) setSubjects((await subjectRes.json()).data.subjects as SubjectItem[]);
        if (planList.length > 0) setSelectedPlanId((c) => c ?? planList[0].planId);
      } catch (err) {
        if (!cancelled) setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load planner" });
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadPlans]);

  useEffect(() => {
    if (!selectedPlanId) { setPlanDetail(null); setTasks([]); return; }
    let cancelled = false;
    setLoadingDetail(true);
    loadPlanDetail(selectedPlanId)
      .then(({ plan, tasks: t }) => {
        if (cancelled) return;
        setPlanDetail(plan);
        setTasks(t);
        setExpandedDates(new Set(Object.keys(groupTasksByDate(t)).slice(0, 3)));
      })
      .catch((err) => { if (!cancelled) setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to load plan" }); })
      .finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [selectedPlanId, loadPlanDetail]);

  function updatePlanCounts(planId: string, delta: number) {
    const calc = (completed: number, total: number) => ({ completedTasks: Math.max(0, completed + delta), progress: total > 0 ? Math.round((Math.max(0, completed + delta) / total) * 100) : 0 });
    setPlans((p) => p.map((pl) => pl.planId !== planId ? pl : { ...pl, ...calc(pl.completedTasks, pl.totalTasks) }));
    setPlanDetail((p) => !p || p.planId !== planId ? p : { ...p, ...calc(p.completedTasks, p.totalTasks) });
  }

  async function handleComplete(taskId: string) {
    setActingTaskId(taskId); setMessage(null);
    try {
      const r = await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
      if (!r.ok) throw new Error(await readApiError(r));
      const updated = (await r.json()).data.task as PlannerTask;
      const was = tasks.find((t) => t.taskId === taskId)?.status === "completed";
      setTasks((p) => p.map((t) => t.taskId === taskId ? { ...t, ...updated } : t));
      if (!was && updated.status === "completed" && selectedPlanId) updatePlanCounts(selectedPlanId, 1);
      setMessage({ type: "success", text: "Task marked complete" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not complete task" });
    } finally { setActingTaskId(null); }
  }

  async function handleUndo(taskId: string) {
    setActingTaskId(taskId); setMessage(null);
    try {
      const r = await fetch(`/api/tasks/${taskId}/undo`, { method: "POST" });
      if (!r.ok) throw new Error(await readApiError(r));
      const updated = (await r.json()).data.task as PlannerTask;
      setTasks((p) => p.map((t) => t.taskId === taskId ? { ...t, ...updated } : t));
      if (selectedPlanId) updatePlanCounts(selectedPlanId, -1);
      setMessage({ type: "success", text: "Completion undone" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not undo task" });
    } finally { setActingTaskId(null); }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault(); setGenerating(true); setMessage(null);
    try {
      const r = await fetch("/api/study-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), examDate: new Date(examDate).toISOString(), dailyStudyHours: Number(dailyStudyHours), weakSubjects: weakSubjectIds, syllabusIds: selectedSyllabusIds }),
      });
      if (!r.ok) throw new Error(await readApiError(r));
      const body = await r.json();
      const planId = body.data.plan.planId as string;
      setShowGenerate(false); setTitle(""); setExamDate(""); setWeakSubjectIds([]);
      const list = await loadPlans();
      setPlans(list); setSelectedPlanId(planId);
      setMessage({ type: "success", text: `Plan created with ${body.data.plan.totalTasks} tasks` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to generate plan" });
    } finally { setGenerating(false); }
  }

  async function handleDeletePlan(planId: string) {
    if (!confirm("Delete this study plan and all its tasks?")) return;
    setDeletingPlanId(planId);
    try {
      const r = await fetch(`/api/study-plans/${planId}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await readApiError(r));
      const list = await loadPlans();
      setPlans(list);
      if (selectedPlanId === planId) setSelectedPlanId(list[0]?.planId ?? null);
      setMessage({ type: "success", text: "Study plan deleted" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete plan" });
    } finally { setDeletingPlanId(null); }
  }

  function toggleDate(key: string) {
    setExpandedDates((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  const tasksByDate = groupTasksByDate(tasks);
  const sortedDateKeys = Object.keys(tasksByDate).sort();
  const readySyllabi = syllabi.length > 0;

  const statusConfig: Record<string, { label: string; cls: string }> = {
    completed: { label: "Done", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    in_progress: { label: "In progress", cls: "bg-primary/10 text-primary border-primary/20" },
    missed: { label: "Missed", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    pending: { label: "Pending", cls: "bg-muted/50 text-muted-foreground border-border/60" },
  };

  const priorityDot: Record<string, string> = {
    high: "bg-rose-400", medium: "bg-amber-400", low: "bg-emerald-400",
  };

  return (
    <div className="page-enter space-y-5">
      {message && (
        <p role="status" className={cn("rounded-xl border px-4 py-3 text-sm",
          message.type === "success" ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400" : "border-destructive/25 bg-destructive/8 text-destructive"
        )}>
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Generate schedules from your syllabus, then mark tasks complete as you study.
        </p>
        <Button type="button" size="sm" onClick={() => setShowGenerate((v) => !v)} disabled={!readySyllabi} className="gap-1.5">
          <Plus className="size-3.5" />New plan
        </Button>
      </div>

      {!readySyllabi && !loadingPlans && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 py-10 text-center">
          <p className="text-sm text-muted-foreground">Add and extract a syllabus first, then generate a study plan.</p>
        </div>
      )}

      {showGenerate && readySyllabi && (
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-card">
          <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
            <div className="flex size-8 items-center justify-center rounded-[20px] bg-primary/15">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Generate study plan</h2>
              <p className="text-xs text-muted-foreground">Tasks are spread from tomorrow until the day before your exam.</p>
            </div>
          </div>
          <form onSubmit={handleGenerate} className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan-title" className="text-sm font-semibold text-foreground">Plan title</Label>
                <Input id="plan-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm prep" required className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exam-date" className="text-sm font-semibold text-foreground">Exam date</Label>
                <div className="relative">
                  <Input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                    className="h-10 pr-10 [color-scheme:dark]"
                  />
                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="daily-hours" className="text-sm font-semibold text-foreground">Daily hours</Label>
                <Input id="daily-hours" type="number" min={0.5} max={16} step={0.5} value={dailyStudyHours} onChange={(e) => setDailyStudyHours(e.target.value)} required className="h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Syllabi to include</Label>
              <div className="flex flex-wrap gap-2">
                {syllabi.map((s) => {
                  const checked = selectedSyllabusIds.includes(s.syllabusId);
                  return (
                    <button key={s.syllabusId} type="button"
                      onClick={() => setSelectedSyllabusIds((p) => checked ? p.filter((id) => id !== s.syllabusId) : [...p, s.syllabusId])}
                      className={cn("rounded-xl border px-3 py-1.5 text-sm transition-all",
                        checked ? "border-primary/50 bg-primary/12 text-primary font-medium" : "border-border/60 hover:border-primary/30 hover:bg-white/4"
                      )}>
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {subjects.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Weak subjects <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => {
                    const checked = weakSubjectIds.includes(sub.subjectId);
                    return (
                      <button key={sub.subjectId} type="button"
                        onClick={() => setWeakSubjectIds((p) => checked ? p.filter((id) => id !== sub.subjectId) : [...p, sub.subjectId])}
                        className={cn("rounded-xl border px-3 py-1.5 text-sm transition-all",
                          checked ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-border/60 hover:border-amber-500/30 hover:bg-white/4"
                        )}>
                        {sub.subjectName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={generating || selectedSyllabusIds.length === 0} className="h-10 gap-2">
                {generating ? <><Loader2 className="size-4 animate-spin" />Generating…</> : <><Sparkles className="size-4" />Generate plan</>}
              </Button>
              <Button type="button" variant="outline" className="h-10" onClick={() => setShowGenerate(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Plan list */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card h-fit">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold">Study plans</p>
          </div>
          <div className="p-2 space-y-1">
            {loadingPlans ? (
              <div className="space-y-1 p-1">
                {[0, 1].map((i) => (
                  <div key={i} className="skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">No plans yet.</p>
            ) : plans.map((plan) => (
              <div key={plan.planId} className={cn(
                "flex items-start gap-2 rounded-xl p-2.5 transition-colors",
                selectedPlanId === plan.planId ? "bg-primary/12 border border-primary/25" : "hover:bg-white/4 border border-transparent"
              )}>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelectedPlanId(plan.planId)}>
                  <p className="truncate text-sm font-medium">{plan.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{plan.progress}% · {plan.completedTasks}/{plan.totalTasks}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${plan.progress}%` }} />
                  </div>
                </button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete"
                  disabled={deletingPlanId === plan.planId} onClick={() => handleDeletePlan(plan.planId)}
                  className="size-6 shrink-0 text-muted-foreground hover:text-destructive mt-0.5">
                  {deletingPlanId === plan.planId ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card min-h-80">
          <div className="border-b border-border/60 px-5 py-4">
            {planDetail ? (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-primary" />
                    <h2 className="font-semibold">{planDetail.title}</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Exam {formatDate(planDetail.examDate)} · {planDetail.dailyStudyHours}h/day
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-2xl font-bold tabular-nums text-primary">{planDetail.progress}%</span>
                  <span className="text-xs text-muted-foreground">done</span>
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold">Tasks</p>
            )}
          </div>

          <div className="p-4">
            {loadingDetail ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : !selectedPlanId || !planDetail ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarDays className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Select or create a plan to view tasks.</p>
              </div>
            ) : tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tasks in this plan. Ensure your syllabus has pending topics.</p>
            ) : (
              <div className="space-y-2">
                {sortedDateKeys.map((key) => {
                  const dayTasks = tasksByDate[key]!;
                  const open = expandedDates.has(key);
                  const dayDone = dayTasks.filter((t) => t.status === "completed").length;
                  const allDone = dayDone === dayTasks.length;
                  return (
                    <div key={key} className={cn(
                      "overflow-hidden rounded-xl border transition-colors",
                      allDone ? "border-emerald-500/20 bg-emerald-500/3" : "border-border/60 bg-white/2"
                    )}>
                      <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/3" onClick={() => toggleDate(key)}>
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg transition-transform", open ? "rotate-90" : "")}>
                          <ChevronRight className="size-3.5 text-muted-foreground" />
                        </span>
                        <span className="flex-1 text-sm font-medium">{formatDate(key)}</span>
                        <span className={cn("text-xs font-medium tabular-nums", allDone ? "text-emerald-400" : "text-muted-foreground")}>
                          {dayDone}/{dayTasks.length}
                        </span>
                      </button>
                      {open && (
                        <ul className="border-t border-border/40 divide-y divide-border/30">
                          {dayTasks.map((task) => {
                            const busy = actingTaskId === task.taskId;
                            const done = task.status === "completed";
                            const cfg = statusConfig[task.status] ?? statusConfig["pending"]!;
                            const dot = priorityDot[task.priority] ?? "bg-muted-foreground";
                            return (
                              <li key={task.taskId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                                <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden />
                                <div className="min-w-0 flex-1">
                                  <p className={cn("text-sm font-medium", done && "line-through opacity-50")}>{task.taskTitle}</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    <span className={cn("rounded-full border px-2 py-0.5 text-xs", cfg.cls)}>{cfg.label}</span>
                                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground capitalize">{task.priority}</span>
                                  </div>
                                </div>
                                {done ? (
                                  <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => handleUndo(task.taskId)} className="h-7 gap-1 text-xs">
                                    {busy ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}Undo
                                  </Button>
                                ) : (
                                  <Button type="button" size="sm" disabled={busy} onClick={() => handleComplete(task.taskId)} className="h-7 gap-1 text-xs">
                                    {busy ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}Done
                                  </Button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

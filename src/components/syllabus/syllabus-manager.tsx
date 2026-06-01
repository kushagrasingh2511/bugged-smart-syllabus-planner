"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileImage,
  FileText,
  Loader2,
  PenLine,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
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
import type {
  ExtractionStatus,
  SubjectItem,
  SyllabusItem,
} from "@/types/syllabus";

type UploadTab = "manual" | "pdf" | "image";

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Request failed";
  } catch {
    return "Request failed";
  }
}

function statusBadgeVariant(
  status: ExtractionStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "outline";
    case "failed":
      return "destructive";
    case "processing":
      return "default";
    default:
      return "secondary";
  }
}

function sourceLabel(source: SyllabusItem["sourceType"]) {
  switch (source) {
    case "pdf":
      return "PDF";
    case "image":
      return "Image";
    default:
      return "Manual";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SyllabusManager() {
  const [tab, setTab] = useState<UploadTab>("manual");
  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([]);
  const [subjectsBySyllabus, setSubjectsBySyllabus] = useState<
    Record<string, SubjectItem[]>
  >({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Inline add state
  const [addingSubjectFor, setAddingSubjectFor] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingTopicFor, setAddingTopicFor] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState("");

  const loadSyllabi = useCallback(async () => {
    const response = await fetch("/api/syllabus");
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    const body = await response.json();
    return body.data.syllabi as SyllabusItem[];
  }, []);

  const loadSubjects = useCallback(async (syllabusId: string) => {
    const response = await fetch(
      `/api/subjects?syllabusId=${encodeURIComponent(syllabusId)}`,
    );
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    const body = await response.json();
    return body.data.subjects as SubjectItem[];
  }, []);

  const refreshList = useCallback(async () => {
    try {
      const list = await loadSyllabi();
      setSyllabi(list);
      return list;
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load syllabi",
      });
      return [];
    }
  }, [loadSyllabi]);

  useEffect(() => {
    void (async () => {
      setLoadingList(true);
      await refreshList();
      setLoadingList(false);
    })();
  }, [refreshList]);

  const hasActiveExtraction = syllabi.some(
    (s) =>
      s.extractionStatus === "pending" || s.extractionStatus === "processing",
  );

  useEffect(() => {
    if (!hasActiveExtraction) return;

    const interval = setInterval(() => {
      void refreshList();
    }, 3000);

    return () => clearInterval(interval);
  }, [hasActiveExtraction, refreshList]);

  useEffect(() => {
    if (!expandedId) return;
    const item = syllabi.find((s) => s.syllabusId === expandedId);
    if (!item || item.extractionStatus !== "completed") return;

    void (async () => {
      try {
        const subjects = await loadSubjects(expandedId);
        setSubjectsBySyllabus((prev) => ({ ...prev, [expandedId]: subjects }));
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error ? error.message : "Failed to load subjects",
        });
      }
    })();
  }, [expandedId, syllabi, loadSubjects]);

  async function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    setUploading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/syllabus/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, rawContent }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Upload failed",
        );
      }

      setTitle("");
      setRawContent("");
      setMessage({
        type: "success",
        text: "Syllabus saved. AI extraction has started.",
      });
      const list = await refreshList();
      const created = body.data?.syllabus as SyllabusItem | undefined;
      const id = created?.syllabusId ?? list[0]?.syllabusId;
      if (id) setExpandedId(id);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSubmit(
    endpoint: "/api/syllabus/upload" | "/api/syllabus/upload-image",
    file: File | null,
  ) {
    if (!file) {
      setMessage({ type: "error", text: "Please choose a file." });
      return;
    }
    if (!title.trim()) {
      setMessage({ type: "error", text: "Title is required." });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const body = await response.json();
      setTitle("");
      setPdfFile(null);
      setImageFile(null);
      setMessage({
        type: "success",
        text: "File uploaded. AI extraction has started.",
      });
      await refreshList();
      const id = body.data?.syllabus?.syllabusId as string | undefined;
      if (id) setExpandedId(id);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleRetry(syllabusId: string) {
    setRetryingId(syllabusId);
    setMessage(null);

    try {
      const response = await fetch(`/api/syllabus/${syllabusId}/extract`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setSubjectsBySyllabus((prev) => {
        const next = { ...prev };
        delete next[syllabusId];
        return next;
      });
      setMessage({ type: "success", text: "Extraction completed successfully." });
      await refreshList();
      const subjects = await loadSubjects(syllabusId);
      setSubjectsBySyllabus((prev) => ({ ...prev, [syllabusId]: subjects }));
      setExpandedId(syllabusId);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Extraction failed",
      });
      await refreshList();
    } finally {
      setRetryingId(null);
    }
  }

  function toggleExpand(syllabusId: string) {
    setExpandedId((current) => (current === syllabusId ? null : syllabusId));
  }

  async function handleDeleteSyllabus(syllabusId: string) {
    if (!confirm("Delete this syllabus and all its subjects/topics?")) return;
    setDeletingId(syllabusId);
    try {
      const res = await fetch(`/api/syllabus/${syllabusId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readApiError(res));
      setSubjectsBySyllabus((prev) => { const n = { ...prev }; delete n[syllabusId]; return n; });
      if (expandedId === syllabusId) setExpandedId(null);
      setMessage({ type: "success", text: "Syllabus deleted." });
      await refreshList();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteSubject(syllabusId: string, subjectId: string) {
    if (!confirm("Delete this subject and all its topics?")) return;
    setDeletingId(subjectId);
    try {
      const res = await fetch(`/api/subjects/${subjectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readApiError(res));
      const subjects = await loadSubjects(syllabusId);
      setSubjectsBySyllabus((prev) => ({ ...prev, [syllabusId]: subjects }));
      setMessage({ type: "success", text: "Subject deleted." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteTopic(syllabusId: string, topicId: string) {
    if (!confirm("Delete this topic?")) return;
    setDeletingId(topicId);
    try {
      const res = await fetch(`/api/topics/${topicId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readApiError(res));
      const subjects = await loadSubjects(syllabusId);
      setSubjectsBySyllabus((prev) => ({ ...prev, [syllabusId]: subjects }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Delete failed" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddSubject(syllabusId: string) {
    if (!newSubjectName.trim()) return;
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusId, subjectName: newSubjectName.trim() }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      setNewSubjectName("");
      setAddingSubjectFor(null);
      const subjects = await loadSubjects(syllabusId);
      setSubjectsBySyllabus((prev) => ({ ...prev, [syllabusId]: subjects }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to add subject" });
    }
  }

  async function handleAddTopic(syllabusId: string, subjectId: string) {
    if (!newTopicName.trim()) return;
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, topicName: newTopicName.trim(), difficulty: 3 }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      setNewTopicName("");
      setAddingTopicFor(null);
      const subjects = await loadSubjects(syllabusId);
      setSubjectsBySyllabus((prev) => ({ ...prev, [syllabusId]: subjects }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to add topic" });
    }
  }

  async function handleUpdateTopicStatus(syllabusId: string, topicId: string, status: string) {
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const subjects = await loadSubjects(syllabusId);
      setSubjectsBySyllabus((prev) => ({ ...prev, [syllabusId]: subjects }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Update failed" });
    }
  }

  const tabs: { id: UploadTab; label: string; icon: typeof PenLine }[] = [
    { id: "manual", label: "Manual text", icon: PenLine },
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "image", label: "Image", icon: FileImage },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            Add syllabus
          </CardTitle>
          <CardDescription>
            Upload a PDF or image, or paste syllabus text. Gemini will extract
            subjects and topics automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                type="button"
                variant={tab === id ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(id)}
              >
                <Icon className="size-3.5" />
                {label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="syllabus-title">Title</Label>
            <Input
              id="syllabus-title"
              placeholder="e.g. CS101 — Fall 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </div>

          {tab === "manual" ? (
            <form onSubmit={(e) => void handleManualSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="raw-content">Syllabus content</Label>
                <textarea
                  id="raw-content"
                  required
                  minLength={10}
                  rows={8}
                  placeholder="Paste units, chapters, and topics…"
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className={cn(
                    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none",
                    "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
                  )}
                />
              </div>
              <Button type="submit" disabled={uploading} className="h-10">
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Save & extract
                  </>
                )}
              </Button>
            </form>
          ) : null}

          {tab === "pdf" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleFileSubmit("/api/syllabus/upload", pdfFile);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="pdf-file">PDF file (max 10MB)</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  className="h-10 file:mr-3"
                />
              </div>
              <Button type="submit" disabled={uploading} className="h-10">
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload PDF
                  </>
                )}
              </Button>
            </form>
          ) : null}

          {tab === "image" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleFileSubmit("/api/syllabus/upload-image", imageFile);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="image-file">Image (JPEG, PNG, WebP — max 10MB)</Label>
                <Input
                  id="image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  className="h-10 file:mr-3"
                />
              </div>
              <Button type="submit" disabled={uploading} className="h-10">
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload image
                  </>
                )}
              </Button>
            </form>
          ) : null}

          {message ? (
            <div
              role="alert"
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm",
                message.type === "success"
                  ? "border-primary/30 bg-primary/5 text-foreground"
                  : "border-destructive/30 bg-destructive/5 text-destructive",
              )}
            >
              {message.text}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Your syllabi</CardTitle>
            <CardDescription>
              {hasActiveExtraction
                ? "Extraction in progress — list refreshes automatically."
                : "Expand a completed syllabus to view subjects and topics."}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshList()}
            disabled={loadingList}
          >
            <RefreshCw
              className={cn("size-3.5", loadingList && "animate-spin")}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loadingList && syllabi.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : syllabi.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No syllabi yet. Add one above to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {syllabi.map((item) => {
                const expanded = expandedId === item.syllabusId;
                const subjects = subjectsBySyllabus[item.syllabusId];
                const isActive =
                  item.extractionStatus === "pending" ||
                  item.extractionStatus === "processing";

                return (
                  <li
                    key={item.syllabusId}
                    className="relative rounded-xl border border-border/80 bg-muted/20"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.syllabusId)}
                      className="flex w-full items-start gap-3 p-4 text-left"
                    >
                      {expanded ? (
                        <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{item.title}</span>
                          <Badge variant="outline">{sourceLabel(item.sourceType)}</Badge>
                          <Badge variant={statusBadgeVariant(item.extractionStatus)}>
                            {isActive ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : null}
                            {item.extractionStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </button>
                    <div className="absolute right-3 top-3">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        disabled={deletingId === item.syllabusId}
                        onClick={(e) => { e.stopPropagation(); void handleDeleteSyllabus(item.syllabusId); }}
                        title="Delete syllabus"
                      >
                        {deletingId === item.syllabusId ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </div>

                    {expanded ? (
                      <div className="border-t border-border/60 px-4 pb-4 pt-2">
                        {item.extractionStatus === "failed" ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                              <AlertCircle className="mt-0.5 size-4 shrink-0" />
                              <p>
                                {item.extractionError ?? "Extraction failed."}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={retryingId === item.syllabusId}
                              onClick={() => void handleRetry(item.syllabusId)}
                            >
                              {retryingId === item.syllabusId ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Retrying…
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="size-3.5" />
                                  Retry extraction
                                </>
                              )}
                            </Button>
                          </div>
                        ) : null}

                        {isActive ? (
                          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin text-primary" />
                            Extracting subjects and topics with Gemini…
                          </div>
                        ) : null}

                        {item.extractionStatus === "completed" ? (
                          subjects ? (
                            subjects.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No subjects found in this syllabus.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {subjects.map((subject) => (
                                  <div key={subject.subjectId}>
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-semibold">
                                        {subject.subjectName}
                                      </h4>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          className="size-6 text-muted-foreground hover:text-primary"
                                          title="Add topic"
                                          onClick={() => { setAddingTopicFor(subject.subjectId); setNewTopicName(""); }}
                                        >
                                          <Plus className="size-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          className="size-6 text-muted-foreground hover:text-destructive"
                                          disabled={deletingId === subject.subjectId}
                                          title="Delete subject"
                                          onClick={() => void handleDeleteSubject(item.syllabusId, subject.subjectId)}
                                        >
                                          {deletingId === subject.subjectId ? (
                                            <Loader2 className="size-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="size-3" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    <ul className="mt-2 space-y-1.5">
                                      {subject.topics.map((topic) => (
                                        <li
                                          key={topic.topicId}
                                          className="flex items-center justify-between gap-2 rounded-lg bg-background/80 px-3 py-2 text-sm"
                                        >
                                          <span className="flex-1">{topic.topicName}</span>
                                          <select
                                            className="rounded border border-border bg-transparent px-1.5 py-0.5 text-xs text-muted-foreground"
                                            value={topic.status ?? "pending"}
                                            onChange={(e) => void handleUpdateTopicStatus(item.syllabusId, topic.topicId, e.target.value)}
                                          >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                          </select>
                                          <span className="shrink-0 text-xs text-muted-foreground">
                                            ★ {topic.difficulty}/5
                                          </span>
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="size-5 text-muted-foreground hover:text-destructive"
                                            disabled={deletingId === topic.topicId}
                                            title="Delete topic"
                                            onClick={() => void handleDeleteTopic(item.syllabusId, topic.topicId)}
                                          >
                                            {deletingId === topic.topicId ? (
                                              <Loader2 className="size-3 animate-spin" />
                                            ) : (
                                              <Trash2 className="size-3" />
                                            )}
                                          </Button>
                                        </li>
                                      ))}
                                      {addingTopicFor === subject.subjectId && (
                                        <li className="flex items-center gap-2 rounded-lg bg-background/80 px-3 py-2">
                                          <Input
                                            placeholder="Topic name"
                                            value={newTopicName}
                                            onChange={(e) => setNewTopicName(e.target.value)}
                                            className="h-7 text-sm"
                                            onKeyDown={(e) => { if (e.key === "Enter") void handleAddTopic(item.syllabusId, subject.subjectId); if (e.key === "Escape") setAddingTopicFor(null); }}
                                            autoFocus
                                          />
                                          <Button size="sm" className="h-7 text-xs" onClick={() => void handleAddTopic(item.syllabusId, subject.subjectId)}>Add</Button>
                                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTopicFor(null)}>✕</Button>
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                ))}
                                {/* Add subject */}
                                {addingSubjectFor === item.syllabusId ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      placeholder="Subject name"
                                      value={newSubjectName}
                                      onChange={(e) => setNewSubjectName(e.target.value)}
                                      className="h-8 text-sm"
                                      onKeyDown={(e) => { if (e.key === "Enter") void handleAddSubject(item.syllabusId); if (e.key === "Escape") setAddingSubjectFor(null); }}
                                      autoFocus
                                    />
                                    <Button size="sm" className="h-8" onClick={() => void handleAddSubject(item.syllabusId)}>Add</Button>
                                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingSubjectFor(null)}>✕</Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="mt-1"
                                    onClick={() => { setAddingSubjectFor(item.syllabusId); setNewSubjectName(""); }}
                                  >
                                    <Plus className="size-3.5" />
                                    Add subject
                                  </Button>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" />
                              Loading subjects…
                            </div>
                          )
                        ) : null}

                        {item.extractionStatus === "pending" &&
                        !item.extractionError ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            disabled={retryingId === item.syllabusId}
                            onClick={() => void handleRetry(item.syllabusId)}
                          >
                            {retryingId === item.syllabusId ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Starting…
                              </>
                            ) : (
                              "Run extraction now"
                            )}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ChatInput } from "@/components/assistant/chat-input";
import { ChatMessage, type Message } from "@/components/assistant/chat-message";
import { QuickActions } from "@/components/assistant/quick-actions";
import { cn } from "@/lib/utils";

async function readApiError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : "Request failed";
  } catch {
    return "Request failed";
  }
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted text-muted-foreground">
        <Bot className="size-4" aria-hidden />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3">
        <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Assistant is typing" />
        <span className="text-xs text-muted-foreground">Thinking…</span>
      </div>
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" aria-hidden />
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
          <Bot className="size-7" strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <p className="font-semibold">Your AI study assistant</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Ask me anything about your syllabus, study plan, or exam prep. I have
          access to all your academic data.
        </p>
      </div>
      <div className="w-full max-w-md">
        <QuickActions onSelect={onSelect} />
      </div>
    </div>
  );
}

export function ChatWindow({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-send initial question from ?q= param (once only)
  useEffect(() => {
    if (initialQuestion && !initialSent.current) {
      initialSent.current = true;
      void sendMessage(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    // Build history from current messages (exclude the one we just added)
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const body = await response.json();
      const reply = body.data?.reply as string;

      if (!reply) {
        throw new Error("No response received from assistant");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Message area */}
      <Card className="flex-1 overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardContent
          className={cn(
            "flex h-full flex-col overflow-y-auto p-4",
            !hasMessages && "justify-center",
          )}
          style={{ minHeight: "400px", maxHeight: "60vh" }}
        >
          {!hasMessages ? (
            <EmptyState onSelect={(text) => void sendMessage(text)} />
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error ? (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Quick actions (shown below chat when there are messages) */}
      {hasMessages && !loading ? (
        <QuickActions onSelect={(text) => void sendMessage(text)} />
      ) : null}

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => void sendMessage(input)}
        disabled={loading}
      />
    </div>
  );
}

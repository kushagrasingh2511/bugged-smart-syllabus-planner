"use client";

import { useRef } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit();
      }
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-primary/40">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask anything about your studies…"
        disabled={disabled}
        aria-label="Chat message"
        className={cn(
          "flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "max-h-40 min-h-[1.5rem]",
        )}
      />
      <Button
        type="button"
        size="icon"
        className="size-8 shrink-0 rounded-lg"
        disabled={disabled || !value.trim()}
        onClick={onSubmit}
        aria-label="Send message"
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
}

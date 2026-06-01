import { BookOpen, CalendarCheck, Flame, LifeBuoy, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

const QUICK_ACTIONS = [
  {
    label: "What should I study today?",
    icon: BookOpen,
  },
  {
    label: "Can I finish before my exam?",
    icon: CalendarCheck,
  },
  {
    label: "What is my weakest subject?",
    icon: Flame,
  },
  {
    label: "Generate a crash plan",
    icon: LifeBuoy,
  },
  {
    label: "What revisions are due?",
    icon: RotateCcw,
  },
] as const;

export function QuickActions({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Quick questions
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto gap-1.5 rounded-full px-3 py-1.5 text-xs"
            onClick={() => onSelect(label)}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Bot, BookOpen, CalendarCheck, LifeBuoy, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

const QUICK_LINKS = [
  { label: "What to study today?", icon: BookOpen },
  { label: "Can I finish before exam?", icon: CalendarCheck },
  { label: "Generate crash plan", icon: LifeBuoy },
  { label: "Revisions due?", icon: RotateCcw },
] as const;

export function AiSuggestionCard() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="size-4 text-primary" />
          AI study assistant
        </CardTitle>
        <CardDescription>
          Get personalized guidance, crash plans, and daily study suggestions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map(({ label, icon: Icon }) => (
            <Link
              key={label}
              href={`${ROUTES.assistant}?q=${encodeURIComponent(label)}`}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={ROUTES.assistant}>
            <Bot className="size-4" aria-hidden />
            Open assistant
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

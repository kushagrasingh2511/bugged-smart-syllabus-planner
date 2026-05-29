import Link from "next/link";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  LineChart,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const highlights = [
  {
    icon: Upload,
    title: "Smart syllabus upload",
    description:
      "Upload PDFs or images and let AI extract subjects and topics automatically.",
    accent: "from-violet-500/20 to-violet-500/5 text-violet-600",
  },
  {
    icon: CalendarDays,
    title: "Personalized study plans",
    description:
      "Daily and weekly schedules tuned to your exam dates and available hours.",
    accent: "from-sky-500/20 to-sky-500/5 text-sky-600",
  },
  {
    icon: LineChart,
    title: "Progress tracking",
    description:
      "Completion rates, streaks, and subject-wise analytics on one dashboard.",
    accent: "from-emerald-500/20 to-emerald-500/5 text-emerald-600",
  },
  {
    icon: Bot,
    title: "AI study assistant",
    description:
      "Guidance, task suggestions, and recovery plans when your schedule slips.",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-600",
  },
];

const trustPoints = [
  "Adaptive scheduling",
  "Revision reminders",
  "Missed-task recovery",
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.35] [mask-image:linear-gradient(to_bottom,white,transparent)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <BrandLogo href={ROUTES.home} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href={ROUTES.login} />}>
              Sign in
            </Button>
            <Button render={<Link href={ROUTES.register} />}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-4 py-16 sm:px-6 sm:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1">
            <Sparkles className="size-3" />
            AI-powered academic planning
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">
              Complete your syllabus on time
            </span>
            <span className="mt-1 block text-foreground/90">
              with less stress
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {APP_NAME} helps students organize syllabi, build adaptive study
            schedules, track progress, and recover when plans slip.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="h-10 px-6" render={<Link href={ROUTES.register} />}>
              Create free account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-10 px-6"
              render={<Link href={ROUTES.login} />}
            >
              Sign in
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {highlights.map(({ icon: Icon, title, description, accent }) => (
            <Card
              key={title}
              className="group border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}
                >
                  <Icon className="size-5" strokeWidth={2} />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-base font-semibold">
                    {title}
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-10 text-center sm:px-10">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" aria-hidden />
          <Zap className="mx-auto mb-4 size-8 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Built for students who want structure, not spreadsheets
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Syllabus planning, revisions, and exam prep — organized in one
            intelligent workspace.
          </p>
          <Button className="mt-6" size="lg" render={<Link href={ROUTES.register} />}>
            Start planning today
          </Button>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <p>
          {APP_NAME} — syllabus planning, revisions, and exam prep in one place.
        </p>
      </footer>
    </div>
  );
}

import { CalendarDays, LineChart, Sparkles } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_NAME, ROUTES } from "@/lib/constants";

const sellingPoints = [
  {
    icon: Sparkles,
    title: "AI-organized syllabus",
    text: "Turn PDFs and notes into structured subjects and topics.",
  },
  {
    icon: CalendarDays,
    title: "Adaptive schedules",
    text: "Plans that adjust when life gets in the way of studying.",
  },
  {
    icon: LineChart,
    title: "Clear progress",
    text: "See completion, streaks, and what to focus on next.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden border-r border-border/60 bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(1_0_0/0.12),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <BrandLogo href={ROUTES.home} inverted />
        </div>
        <div className="relative space-y-8">
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">
              Welcome to
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Your academic command center
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
              {APP_NAME} combines intelligent planning with progress analytics
              so you can focus on learning — not juggling calendars.
            </p>
          </div>
          <ul className="space-y-4">
            {sellingPoints.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm text-primary-foreground/75">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Secure sign-in · Your data stays private
        </p>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-10 sm:px-6">
        <div className="mb-8 lg:hidden">
          <BrandLogo href={ROUTES.home} showTagline />
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = ROUTES.login;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <MobileHeader title={title} onLogout={() => void handleLogout()} />

        {/* Desktop page header */}
        <header className="hidden shrink-0 border-b border-border/60 bg-background/80 px-8 py-6 backdrop-blur-xl lg:block">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[0.9375rem] text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </header>

        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto bg-background">
          {/* Top gradient accent line */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            aria-hidden
          />
          {/* Subtle radial glow from top */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,oklch(0.65_0.22_270/0.06),transparent)]"
            aria-hidden
          />
          <div className="relative p-6 sm:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

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
    <div className="flex min-h-screen bg-muted/20">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader title={title} onLogout={() => void handleLogout()} />
        <header className="hidden border-b bg-background/80 px-6 py-6 backdrop-blur-md lg:block">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>
        <main
          className={cn(
            "relative flex-1 overflow-hidden p-4 sm:p-6",
            "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/8%,transparent)]",
          )}
        >
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}

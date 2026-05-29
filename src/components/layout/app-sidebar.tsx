"use client";

import { LogOut } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = ROUTES.login;
  }

  return (
    <aside className="hidden h-full w-[17.5rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="px-4 py-5">
        <BrandLogo href={ROUTES.dashboard} showTagline />
      </div>
      <Separator className="bg-sidebar-border" />
      <div className="flex flex-1 flex-col p-3">
        <SidebarNav />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-sidebar-border bg-transparent"
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}

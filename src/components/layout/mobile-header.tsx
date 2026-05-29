"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROUTES } from "@/lib/constants";

export function MobileHeader({
  title,
  onLogout,
}: {
  title: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Open menu" />
          }
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0" showCloseButton>
          <SheetHeader className="border-b px-4 py-4 text-left">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <BrandLogo href={ROUTES.dashboard} showTagline />
          </SheetHeader>
          <div className="flex flex-1 flex-col p-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
          <div className="mt-auto border-t p-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <p className="truncate text-sm font-semibold">{title}</p>
      <div className="size-8" aria-hidden />
    </header>
  );
}

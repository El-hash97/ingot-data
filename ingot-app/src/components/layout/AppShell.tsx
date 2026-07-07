"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import BottomNav from "@/components/layout/BottomNav";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/input": "Input Data",
  "/riwayat": "Riwayat",
};

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-xs font-mono text-sidebar-foreground/50 tracking-wider">
      {time}
    </span>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pageTitle = PAGE_TITLES[pathname] ?? "Ingot Monitor";

  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---- SIDEBAR (desktop, md and up) ---- */}
      <aside
        className={cn(
          "hidden md:flex fixed top-0 left-0 z-50 h-screen w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-250 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
              Ingot Monitor
            </span>
            <span className="text-[11px] text-sidebar-foreground/50 font-medium">
              v2.0
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Menu Utama
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <Clock />
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <div
        className={cn(
          "flex flex-1 flex-col min-h-screen transition-all duration-250",
          sidebarOpen ? "md:ml-60" : "md:ml-0"
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-5">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-8 w-8 text-muted-foreground"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="hidden md:block h-5" />

          {/* Mobile brand row */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-foreground">Ingot Monitor</span>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">{pageTitle}</h2>

          <div className="ml-auto hidden md:block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted border border-border px-3 py-1.5">
              {dateStr}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 pb-20 md:pb-8">{children}</main>
      </div>

      {/* ---- BOTTOM NAV (mobile only) ---- */}
      <BottomNav />
    </div>
  );
}

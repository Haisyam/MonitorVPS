"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  HardDrive,
  LayoutDashboard,
  Network,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { MaintenanceBanner } from "@/components/dashboard/maintenance-banner";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/processes", label: "Processes", icon: Activity },
  { href: "/dashboard/network", label: "Network", icon: Network },
  { href: "/dashboard/storage", label: "Storage", icon: HardDrive },
  { href: "/dashboard/services", label: "Services", icon: ShieldAlert },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function NavLinks({ closeOnClick }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        const link = (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
              active
                ? "bg-panel-strong text-foreground ring-glow"
                : "text-muted hover:bg-panel/60 hover:text-foreground"
            )}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );

        if (closeOnClick) {
          return (
            <SheetClose key={item.href} asChild>
              {link}
            </SheetClose>
          );
        }

        return link;
      })}
    </nav>
  );
}

export function DashboardShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-72 flex-col gap-8 border-r border-border/60 bg-panel/40 px-6 py-8 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-glow">
              <Cpu size={20} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted">VPS</p>
              <p className="text-lg font-semibold">PulseOps</p>
            </div>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto space-y-3">
          <div className="glass-panel rounded-2xl p-4 text-xs text-muted">
            <p className="font-semibold text-foreground">Realtime Mode</p>
            <p>Monitoring with 1s cache window.</p>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 bg-panel/30 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <LayoutDashboard size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-glow">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted">VPS</p>
                      <p className="text-lg font-semibold">PulseOps</p>
                    </div>
                  </div>
                  <NavLinks closeOnClick />
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-sm font-semibold">Monitoring Dashboard</p>
              <p className="text-xs text-muted">Production-grade VPS insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">Admin</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-6 lg:px-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <MaintenanceBanner />
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

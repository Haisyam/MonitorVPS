import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-glow">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">PulseOps</p>
            <p className="text-lg font-semibold">VPS Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              Open Dashboard
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-16 px-6 pb-20 pt-8">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-panel/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted">
              <ShieldCheck size={14} />
              Secure realtime telemetry
            </div>
            <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">
              Monitor your VPS in real time with a glassmorphism control room.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              PulseOps brings CPU, RAM, disk, network, processes, and service health into a single
              dashboard with modern alerts, charts, and SSE streaming.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">Launch Dashboard</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Secure Login</Link>
              </Button>
            </div>
          </div>
          <Card className="glass-strong">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Live Snapshot</p>
                <h2 className="text-2xl font-semibold">Infrastructure Overview</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">CPU Load</span>
                  <span className="font-semibold">28%</span>
                </div>
                <div className="h-2 rounded-full bg-panel/60">
                  <div className="h-2 w-[28%] rounded-full bg-accent" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Memory Usage</span>
                  <span className="font-semibold">12.4 GB / 32 GB</span>
                </div>
                <div className="h-2 rounded-full bg-panel/60">
                  <div className="h-2 w-[38%] rounded-full bg-accent-2" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Network</span>
                  <span className="font-semibold">12.5 MB/s</span>
                </div>
                <div className="h-2 rounded-full bg-panel/60">
                  <div className="h-2 w-[52%] rounded-full bg-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Realtime + SSE",
              desc: "Stream metrics with 1s cache to keep dashboards responsive without overload.",
            },
            {
              title: "Service Watch",
              desc: "Track apache2, nginx, MySQL, PM2, and custom services with status badges.",
            },
            {
              title: "Alert Discipline",
              desc: "Set CPU/RAM/Disk thresholds, toasts, and UI warnings for ops awareness.",
            },
          ].map((item) => (
            <Card key={item.title} className="glass-panel">
              <CardContent className="space-y-3 p-6">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}

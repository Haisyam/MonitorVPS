"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Network, Server, Waves } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/lib/hooks/use-api";
import { useSummaryStream } from "@/lib/hooks/use-summary-stream";
import { useSettings } from "@/lib/hooks/use-settings";
import { formatBytes, formatPercent, formatUptime } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import { PROJECTS } from "@/config/projects";

const AreaMetricsChart = dynamic(() => import("@/components/charts/area-metrics-chart"), { ssr: false });
const NetworkChart = dynamic(() => import("@/components/charts/network-chart"), { ssr: false });

function classify(value, threshold) {
  if (!Number.isFinite(value)) return "unknown";
  if (value >= threshold) return "critical";
  if (value >= threshold * 0.85) return "warning";
  return "healthy";
}

export default function DashboardPage() {
  const [settings] = useSettings();
  const refreshMs = Number.isFinite(settings.refreshMs) ? settings.refreshMs : 1000;
  const { summary, connected } = useSummaryStream({ interval: refreshMs });
  const { data: processData, loading: loadingProcesses, error: processError } = useApi(
    "/api/metrics/processes?limit=6&sort=cpu",
    { interval: 5000 }
  );
  const { data: healthData, error: healthError } = useApi("/api/metrics/health", { interval: 8000 });
  const { data: servicesData, error: servicesError } = useApi("/api/metrics/services", { interval: 10000 });
  const { data: logsData, error: logsError } = useApi("/api/metrics/logs", { interval: 12000 });
  const { toast } = useToast();
  const lastAlertRef = useRef("");
  const summaryData = summary?.summary;
  const summaryTimestamp = summary?.timestamp;

  const lastTimestampRef = useRef(null);

  const [series, setSeries] = useState([]);

  useEffect(() => {
    if (!summaryData || !summaryTimestamp) return;
    if (lastTimestampRef.current === summaryTimestamp) return;
    lastTimestampRef.current = summaryTimestamp;
    const nextPoint = {
      cpu: summaryData.cpuPercent,
      mem: summaryData.mem.percent,
      rx: summaryData.network.rxSec,
      tx: summaryData.network.txSec,
      time: new Date(summaryTimestamp).toLocaleTimeString(),
    };
    setSeries((prev) => [...prev, nextPoint].slice(-24));
  }, [summaryTimestamp]);

  const cpuStatus = classify(summaryData?.cpuPercent, settings.thresholds.cpu);
  const memStatus = classify(summaryData?.mem?.percent, settings.thresholds.ram);
  const diskStatus = classify(summaryData?.disk?.percent, settings.thresholds.disk);

  useEffect(() => {
    if (!summaryData) return;
    const alerts = [];
    if (cpuStatus === "critical") alerts.push(`CPU usage ${formatPercent(summaryData.cpuPercent)}`);
    if (memStatus === "critical") alerts.push(`RAM usage ${formatPercent(summaryData.mem.percent)}`);
    if (diskStatus === "critical") alerts.push(`Disk usage ${formatPercent(summaryData.disk.percent)}`);
    const alertKey = `${cpuStatus}|${memStatus}|${diskStatus}`;
    if (alertKey === lastAlertRef.current) return;
    lastAlertRef.current = alertKey;
    if (alerts.length) {
      toast({
        title: "Alert threshold breached",
        description: alerts.join(" | "),
        variant: "danger",
      });
    }
  }, [cpuStatus, memStatus, diskStatus, summaryTimestamp, toast]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold">Realtime Overview</h1>
          <p className="text-sm text-muted">
            {connected ? "Live stream connected" : "Reconnecting stream"} - Cache 1s
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/dashboard/settings">Edit Alerts</Link>
        </Button>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <MetricCard
            title="CPU"
            value={summaryData ? formatPercent(summaryData.cpuPercent) : "--"}
            detail={summaryData ? `${summaryData.load.map((item) => item.toFixed(2)).join(" / ")}` : null}
            percent={summaryData?.cpuPercent}
            status={cpuStatus}
            accent="bg-accent"
          />
        </motion.div>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <MetricCard
            title="Memory"
            value={summaryData ? formatPercent(summaryData.mem.percent) : "--"}
            detail={summaryData ? `${formatBytes(summaryData.mem.used)} / ${formatBytes(summaryData.mem.total)}` : null}
            percent={summaryData?.mem?.percent}
            status={memStatus}
            accent="bg-emerald-400"
          />
        </motion.div>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <MetricCard
            title="Disk"
            value={summaryData ? formatPercent(summaryData.disk.percent) : "--"}
            detail={summaryData ? `${formatBytes(summaryData.disk.used)} / ${formatBytes(summaryData.disk.total)}` : null}
            percent={summaryData?.disk?.percent}
            status={diskStatus}
            accent="bg-orange-400"
          />
        </motion.div>
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <MetricCard
            title="Uptime"
            value={summaryData ? formatUptime(summaryData.uptimeSec) : "--"}
            detail={summaryData ? `RX ${formatBytes(summaryData.network.rxSec)}/s` : null}
            status="healthy"
            accent="bg-violet-400"
          />
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>CPU & Memory</CardTitle>
                <p className="text-sm text-muted">Last 24 samples</p>
              </div>
              <Badge variant="info">SSE</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {series.length ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <AreaMetricsChart data={series} dataKey="cpu" color="#7c8cff" />
                </motion.div>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
              {series.length ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <AreaMetricsChart data={series} dataKey="mem" color="#34d399" />
                </motion.div>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Network Throughput</CardTitle>
              <p className="text-sm text-muted">RX vs TX per second</p>
            </CardHeader>
            <CardContent>
              {series.length ? <NetworkChart data={series} /> : <Skeleton className="h-44 w-full" />}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Health Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthError ? (
                <p className="text-sm text-danger">Failed to load health checks.</p>
              ) : (healthData?.health?.checks || []).length === 0 ? (
                <p className="text-sm text-muted">No health endpoints configured.</p>
              ) : (
                healthData.health.checks.map((check) => (
                  <div key={check.name} className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold">{check.name}</p>
                      <p className="text-xs text-muted">{check.url}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {check.ok ? (
                        <CheckCircle2 size={14} className="text-success" />
                      ) : (
                        <AlertTriangle size={14} className="text-danger" />
                      )}
                      <span>{check.latencyMs}ms</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Services</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/services">
                  Details <ArrowUpRight size={14} />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {servicesError ? (
                <p className="text-sm text-danger">Failed to load services.</p>
              ) : (
                (servicesData?.services || []).slice(0, 4).map((service) => (
                  <div key={service.name} className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-muted" />
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                    <Badge variant={service.status === "running" ? "success" : "danger"}>
                      {service.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROJECTS.map((project) => {
                const check = healthData?.health?.checks?.find((item) =>
                  item.url.includes(project.label)
                );
                return (
                  <div key={project.label} className="flex items-center justify-between rounded-xl bg-panel/60 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold">{project.name}</p>
                      <p className="text-xs text-muted">{project.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={check?.ok ? "success" : "warning"}>{check?.ok ? "up" : "check"}</Badge>
                      <Link href={project.url} target="_blank" rel="noreferrer">
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Logs & Errors</CardTitle>
              <Badge variant={logsData?.totalErrors ? "danger" : "success"}>
                {logsData?.totalErrors ?? 0} errors
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {logsError ? (
                <p className="text-sm text-danger">Failed to load logs.</p>
              ) : (logsData?.logs || []).length === 0 ? (
                <p className="text-sm text-muted">No log files configured.</p>
              ) : (
                logsData.logs.map((log) => (
                  <div key={log.path} className="rounded-2xl border border-border bg-panel/60 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{log.name}</p>
                        <p className="text-xs text-muted">{log.path}</p>
                      </div>
                      <Badge variant={log.errorCount ? "warning" : "success"}>
                        {log.errorCount} errors
                      </Badge>
                    </div>
                    {log.lines?.length ? (
                      <div className="mt-3 space-y-1 rounded-xl bg-panel/70 p-2 text-xs text-muted">
                        {log.lines.slice(-3).map((line, index) => (
                          <p key={`${log.path}-${index}`}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">No log lines available.</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Processes</CardTitle>
            <p className="text-sm text-muted">Sorted by CPU</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/processes">
              View all <ArrowUpRight size={14} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingProcesses ? (
            <Skeleton className="h-32 w-full" />
          ) : processError ? (
            <p className="text-sm text-danger">Failed to load processes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Process</TableHead>
                  <TableHead>PID</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>RAM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(processData?.list || []).map((proc) => (
                  <TableRow key={proc.pid}>
                    <TableCell className="font-medium">{proc.name}</TableCell>
                    <TableCell>{proc.pid}</TableCell>
                    <TableCell>{formatPercent(proc.cpu)}</TableCell>
                    <TableCell>{formatPercent(proc.mem)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Realtime Network</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl bg-panel/60 p-4">
            <div className="rounded-2xl bg-accent/20 p-3 text-accent">
              <Waves size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Inbound</p>
              <p className="text-lg font-semibold">
                {summaryData ? `${formatBytes(summaryData.network.rxSec)}/s` : "--"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-panel/60 p-4">
            <div className="rounded-2xl bg-accent-2/20 p-3 text-accent-2">
              <Network size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Outbound</p>
              <p className="text-lg font-semibold">
                {summaryData ? `${formatBytes(summaryData.network.txSec)}/s` : "--"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/lib/hooks/use-api";
import { formatPercent } from "@/lib/format";

function toCsv(list) {
  const headers = ["pid", "name", "cpu", "mem", "user", "state", "path"];
  const rows = list.map((proc) =>
    [proc.pid, proc.name, proc.cpu, proc.mem, proc.user, proc.state, proc.path]
      .map((item) => `"${String(item ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export default function ProcessesPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("cpu");

  const query = useMemo(() => {
    const params = new URLSearchParams({
      limit: "120",
      sort,
    });
    if (search) params.set("search", search);
    return `/api/metrics/processes?${params.toString()}`;
  }, [search, sort]);

  const { data, loading, error, refresh } = useApi(query, { interval: 5000 });

  const handleExport = (format) => {
    if (!data?.list) return;
    const content = format === "csv" ? toCsv(data.list) : JSON.stringify(data.list, null, 2);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `processes.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Process Explorer</CardTitle>
            <p className="text-sm text-muted">Cari proses aktif, sort berdasarkan CPU atau RAM.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search name / user / path"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-64"
            />
            <Button variant={sort === "cpu" ? "default" : "secondary"} onClick={() => setSort("cpu")}>
              Sort CPU
            </Button>
            <Button variant={sort === "mem" ? "default" : "secondary"} onClick={() => setSort("mem")}>
              Sort RAM
            </Button>
            <Button variant="ghost" onClick={refresh}>
              <RefreshCcw size={16} />
            </Button>
            <Button variant="ghost" onClick={() => handleExport("csv")}>
              <Download size={16} /> CSV
            </Button>
            <Button variant="ghost" onClick={() => handleExport("json")}>
              <Download size={16} /> JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : error ? (
            <p className="text-sm text-danger">Failed to load processes. Try refresh.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Process</TableHead>
                  <TableHead>PID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.list || []).map((proc) => (
                  <TableRow key={proc.pid}>
                    <TableCell className="font-medium">{proc.name}</TableCell>
                    <TableCell>{proc.pid}</TableCell>
                    <TableCell>{proc.user || "-"}</TableCell>
                    <TableCell>{formatPercent(proc.cpu)}</TableCell>
                    <TableCell>{formatPercent(proc.mem)}</TableCell>
                    <TableCell>{proc.state || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

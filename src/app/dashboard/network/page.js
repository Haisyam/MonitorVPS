"use client";

import { Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/lib/hooks/use-api";
import { formatBytes } from "@/lib/format";

export default function NetworkPage() {
  const { data, loading, error } = useApi("/api/metrics/network", { interval: 5000 });

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Network Interfaces</CardTitle>
          <Network size={18} className="text-muted" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : error ? (
            <p className="text-sm text-danger">Failed to load network stats.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interface</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>RX /s</TableHead>
                  <TableHead>TX /s</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.network || []).map((item) => (
                  <TableRow key={item.iface}>
                    <TableCell className="font-medium">{item.iface}</TableCell>
                    <TableCell>{item.ip4 || "-"}</TableCell>
                    <TableCell>{item.speed ? `${item.speed} Mbps` : "-"}</TableCell>
                    <TableCell>{formatBytes(item.rxSec)}/s</TableCell>
                    <TableCell>{formatBytes(item.txSec)}/s</TableCell>
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

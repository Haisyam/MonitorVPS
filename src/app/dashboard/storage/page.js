"use client";

import { HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi } from "@/lib/hooks/use-api";
import { formatBytes, formatPercent } from "@/lib/format";

export default function StoragePage() {
  const { data, loading, error } = useApi("/api/metrics/storage", { interval: 7000 });

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Storage Devices</CardTitle>
          <HardDrive size={18} className="text-muted" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : error ? (
            <p className="text-sm text-danger">Failed to load storage.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mount</TableHead>
                  <TableHead>Filesystem</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Use%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.storage?.disks || []).map((disk) => (
                  <TableRow key={disk.mount}>
                    <TableCell className="font-medium">{disk.mount}</TableCell>
                    <TableCell>{disk.fs}</TableCell>
                    <TableCell>{formatBytes(disk.size)}</TableCell>
                    <TableCell>{formatBytes(disk.used)}</TableCell>
                    <TableCell>{formatPercent(disk.use)}</TableCell>
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

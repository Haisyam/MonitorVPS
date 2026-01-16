"use client";

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/hooks/use-api";

export default function ServicesPage() {
  const { data, loading, error } = useApi("/api/metrics/services", { interval: 10000 });

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Service Status</CardTitle>
          <ShieldCheck size={18} className="text-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : error ? (
            <p className="text-sm text-danger">Failed to load services.</p>
          ) : (data?.services || []).length === 0 ? (
            <p className="text-sm text-muted">No services configured. Update DASHBOARD_SERVICES.</p>
          ) : (
            (data?.services || []).map((service) => (
              <div
                key={service.name}
                className="flex flex-col gap-2 rounded-2xl bg-panel/60 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{service.name}</p>
                  <p className="text-xs text-muted">{service.detail || "systemctl"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={service.status === "running" ? "success" : "danger"}>
                    {service.status}
                  </Badge>
                  {service.since ? <span className="text-xs text-muted">since {service.since}</span> : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

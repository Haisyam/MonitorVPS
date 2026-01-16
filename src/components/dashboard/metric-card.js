import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  detail,
  percent,
  status,
  accent = "bg-accent",
}) {
  const statusVariant =
    status === "critical"
      ? "danger"
      : status === "warning"
        ? "warning"
        : status === "unknown"
          ? "default"
          : "success";

  return (
    <Card className="group relative overflow-hidden">
      <div className={cn("absolute inset-x-0 top-0 h-1", accent)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm uppercase tracking-widest text-muted">
          {title}
        </CardTitle>
        {status ? (
          <Badge variant={statusVariant}>{status}</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-foreground">{value}</span>
          {detail ? <span className="text-sm text-muted">{detail}</span> : null}
        </div>
        {typeof percent === "number" ? (
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-panel/60">
              <div
                className={cn("h-2 rounded-full", accent)}
                style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted">{percent.toFixed(1)}% used</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

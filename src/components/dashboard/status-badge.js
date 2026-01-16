import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }) {
  const value = (status || "").toLowerCase();
  if (value === "healthy" || value === "running") {
    return <Badge variant="success">Healthy</Badge>;
  }
  if (value === "degraded" || value === "warning") {
    return <Badge variant="warning">Warning</Badge>;
  }
  if (value === "critical" || value === "stopped") {
    return <Badge variant="danger">Critical</Badge>;
  }
  return <Badge variant="default">Unknown</Badge>;
}

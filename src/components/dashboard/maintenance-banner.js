"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { Badge } from "@/components/ui/badge";

export function MaintenanceBanner() {
  const [settings] = useSettings();

  if (!settings?.maintenanceMode) return null;

  return (
    <div className="glass-panel flex items-center justify-between gap-4 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <Badge variant="warning">Maintenance</Badge>
        <span className="text-muted">
          Dashboard is in maintenance mode. Metrics updates remain active but changes are restricted.
        </span>
      </div>
    </div>
  );
}

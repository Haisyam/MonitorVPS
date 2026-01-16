"use client";

import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/hooks/use-settings";

export default function SettingsPage() {
  const [settings, setSettings] = useSettings();

  const updateThreshold = (key, value) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    setSettings({
      ...settings,
      thresholds: {
        ...settings.thresholds,
        [key]: safeValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alert Thresholds</CardTitle>
          <Settings size={18} className="text-muted" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>CPU Warning (%)</Label>
            <Input
              type="number"
              value={settings.thresholds.cpu}
              min={1}
              max={100}
              onChange={(event) => updateThreshold("cpu", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>RAM Warning (%)</Label>
            <Input
              type="number"
              value={settings.thresholds.ram}
              min={1}
              max={100}
              onChange={(event) => updateThreshold("ram", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Disk Warning (%)</Label>
            <Input
              type="number"
              value={settings.thresholds.disk}
              min={1}
              max={100}
              onChange={(event) => updateThreshold("disk", Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Refresh Interval (ms)</Label>
            <Input
              type="number"
              value={settings.refreshMs}
              min={500}
              max={5000}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  refreshMs: Math.max(500, Number(event.target.value) || 0),
                })
              }
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  maintenanceMode: checked,
                })
              }
            />
            <div>
              <p className="text-sm font-medium">Maintenance Mode</p>
              <p className="text-xs text-muted">Show banner across dashboard.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

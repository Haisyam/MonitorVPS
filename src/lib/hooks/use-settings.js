"use client";

import { DEFAULT_SETTINGS, SETTINGS_KEY } from "@/lib/settings";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

export function useSettings() {
  const [settings, setSettings] = useLocalStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings,
    thresholds: {
      ...DEFAULT_SETTINGS.thresholds,
      ...(settings?.thresholds || {}),
    },
  };
  return [merged, setSettings];
}

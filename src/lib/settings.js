export const SETTINGS_KEY = "vps-dashboard-settings";

export const DEFAULT_SETTINGS = {
  thresholds: {
    cpu: 80,
    ram: 85,
    disk: 90,
  },
  refreshMs: 1000,
  maintenanceMode: false,
};

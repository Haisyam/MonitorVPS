export const API_KEY = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY || "";
export const DEFAULT_REFRESH_MS = Number.parseInt(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL || "1000",
  10
);

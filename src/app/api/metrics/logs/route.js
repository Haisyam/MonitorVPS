import { apiGuard, handleOptions, jsonResponse } from "@/lib/api";
import { getLogsSummary } from "@/lib/metrics/logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req) {
  return handleOptions(req);
}

export async function GET(req) {
  const guard = apiGuard(req);
  if (guard) return guard;
  const data = await getLogsSummary();
  return jsonResponse(req, data);
}

import { apiGuard, handleOptions, jsonResponse } from "@/lib/api";
import { getProcessList } from "@/lib/metrics/processes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req) {
  return handleOptions(req);
}

export async function GET(req) {
  const guard = apiGuard(req);
  if (guard) return guard;
  const url = new URL(req.url);
  const limitParam = Number.parseInt(url.searchParams.get("limit") || "50", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;
  const sort = url.searchParams.get("sort") === "mem" ? "mem" : "cpu";
  const search = url.searchParams.get("search") || "";
  const data = await getProcessList({ limit, sort, search });
  return jsonResponse(req, data);
}

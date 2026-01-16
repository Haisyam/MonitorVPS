import { apiGuard, handleOptions, jsonResponse } from "@/lib/api";
import { getNetwork } from "@/lib/metrics/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req) {
  return handleOptions(req);
}

export async function GET(req) {
  const guard = apiGuard(req);
  if (guard) return guard;
  const data = await getNetwork();
  return jsonResponse(req, data);
}

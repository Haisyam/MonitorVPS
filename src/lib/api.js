const rateStore = new Map();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 120;

function getRateConfig() {
  const windowMs = Number.parseInt(process.env.DASHBOARD_RATE_WINDOW_MS || "60000", 10);
  const limit = Number.parseInt(process.env.DASHBOARD_RATE_LIMIT || "120", 10);
  return {
    windowMs: Number.isFinite(windowMs) ? windowMs : DEFAULT_WINDOW_MS,
    limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
  };
}

export function getClientIp(req) {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function hasValidApiKey(req) {
  const headerKey = req.headers.get("x-api-key");
  const url = new URL(req.url);
  const queryKey = url.searchParams.get("key");
  const provided = headerKey || queryKey;
  const expected = process.env.DASHBOARD_API_KEY;
  if (!expected) return false;
  return provided === expected;
}

export function rateLimit(req) {
  const { windowMs, limit } = getRateConfig();
  const key = `${getClientIp(req)}:${new URL(req.url).pathname}`;
  const now = Date.now();
  const entry = rateStore.get(key);
  if (!entry) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  entry.count += 1;
  if (entry.count > limit) {
    return {
      limit,
      resetAt: entry.resetAt,
    };
  }
  return null;
}

export function resolveCorsOrigin(req) {
  const allowed = process.env.DASHBOARD_ALLOWED_ORIGIN;
  const origin = req.headers.get("origin");
  if (allowed) {
    if (origin && origin !== allowed) return "";
    return allowed;
  }
  return origin || "";
}

export function withCorsHeaders(req, headers = {}) {
  const origin = resolveCorsOrigin(req);
  const base = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Allow-Credentials": "true",
    ...headers,
  };
  if (origin) {
    base["Access-Control-Allow-Origin"] = origin;
  }
  return base;
}

export function jsonResponse(req, data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...withCorsHeaders(req, headers),
    },
  });
}

export function handleOptions(req) {
  return new Response(null, {
    status: 204,
    headers: withCorsHeaders(req),
  });
}

export function apiGuard(req) {
  if (!hasValidApiKey(req)) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }
  const limit = rateLimit(req);
  if (limit) {
    return jsonResponse(req, {
      error: "Rate limit exceeded",
      limit: limit.limit,
      resetAt: limit.resetAt,
    }, 429);
  }
  return null;
}

const DEFAULT_TIMEOUT_MS = 3000;

function parseHealthTargets() {
  const raw = process.env.DASHBOARD_HEALTH_URLS || "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((url) => ({
      name: url.replace(/^https?:\/\//, "").split("/")[0],
      url,
    }));
}

async function checkUrl(target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(target.url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    return {
      name: target.name,
      url: target.url,
      ok: res.ok,
      status: res.status,
      latencyMs,
    };
  } catch (error) {
    return {
      name: target.name,
      url: target.url,
      ok: false,
      status: 0,
      latencyMs: Date.now() - start,
      error: "unreachable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getHealthChecks() {
  const targets = parseHealthTargets();
  if (targets.length === 0) {
    return {
      status: "healthy",
      checks: [],
    };
  }
  const checks = await Promise.all(targets.map(checkUrl));
  const status = checks.some((check) => !check.ok) ? "degraded" : "healthy";
  return {
    status,
    checks,
  };
}

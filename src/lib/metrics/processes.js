import * as si from "systeminformation";
import pidusage from "pidusage";

const cache = {
  timestamp: 0,
  data: null,
};

function getCacheTtlMs() {
  const ttl = Number.parseInt(process.env.PROCESS_CACHE_MS || "1500", 10);
  return Number.isFinite(ttl) ? ttl : 1500;
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeProcess(proc) {
  return {
    pid: proc.pid,
    name: proc.name,
    cpu: safeNumber(proc.cpu),
    mem: safeNumber(proc.mem),
    memRss: safeNumber(proc.memRss),
    user: proc.user,
    path: proc.path,
    state: proc.state,
  };
}

async function getTargetedUsage() {
  const raw = process.env.DASHBOARD_PIDS || "";
  const pids = raw
    .split(",")
    .map((pid) => Number.parseInt(pid.trim(), 10))
    .filter((pid) => Number.isFinite(pid));
  if (pids.length === 0) return [];
  try {
    const usage = await pidusage(pids);
    return Object.entries(usage).map(([pid, stats]) => ({
      pid: Number.parseInt(pid, 10),
      cpu: safeNumber(stats.cpu),
      memory: safeNumber(stats.memory),
      elapsed: safeNumber(stats.elapsed),
      timestamp: stats.timestamp,
    }));
  } catch (error) {
    return [];
  }
}

export async function getProcessList({ limit = 50, sort = "cpu", search = "" } = {}) {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < getCacheTtlMs()) {
    const cached = buildResponse(cache.data, { limit, sort, search });
    return {
      ...cached,
      targeted: await getTargetedUsage(),
    };
  }
  let data;
  try {
    data = await si.processes();
  } catch (error) {
    data = { list: [], all: 0, running: 0, blocked: 0, sleeping: 0 };
  }
  cache.timestamp = now;
  cache.data = data;
  const response = buildResponse(data, { limit, sort, search });
  return {
    ...response,
    targeted: await getTargetedUsage(),
  };
}

function buildResponse(data, { limit, sort, search }) {
  const term = search.trim().toLowerCase();
  let list = data.list || [];
  if (term) {
    list = list.filter((proc) =>
      `${proc.name} ${proc.user} ${proc.path}`.toLowerCase().includes(term)
    );
  }
  const sorter = sort === "mem" ? (a, b) => b.mem - a.mem : (a, b) => b.cpu - a.cpu;
  const normalized = list.map(normalizeProcess).sort(sorter);
  return {
    timestamp: Date.now(),
    total: data.all,
    running: data.running,
    blocked: data.blocked,
    sleeping: data.sleeping,
    list: normalized.slice(0, limit),
  };
}

import os from "os";
import * as si from "systeminformation";
import pidusage from "pidusage";
import { getHealthChecks } from "./health";

const cache = {
  timestamp: 0,
  data: null,
};

const summaryCache = {
  timestamp: 0,
  data: null,
};

const systemCache = {
  timestamp: 0,
  data: null,
};

const storageCache = {
  timestamp: 0,
  data: null,
};

const networkCache = {
  timestamp: 0,
  data: null,
};

const servicesCache = {
  timestamp: 0,
  data: null,
};

const healthCache = {
  timestamp: 0,
  data: null,
};

function getCacheTtlMs() {
  const ttl = Number.parseInt(process.env.METRICS_CACHE_MS || "1000", 10);
  return Number.isFinite(ttl) ? ttl : 1000;
}

function getDetailCacheTtlMs() {
  const ttl = Number.parseInt(process.env.DETAIL_CACHE_MS || "4000", 10);
  return Number.isFinite(ttl) ? ttl : 4000;
}
function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

async function safe(promise, fallback) {
  try {
    return await promise;
  } catch (error) {
    return fallback;
  }
}

function summarizeMemory(mem) {
  const used = safeNumber(mem.used);
  const total = safeNumber(mem.total);
  return {
    used,
    total,
    percent: total > 0 ? (used / total) * 100 : 0,
  };
}

function summarizeSwap(mem) {
  const used = safeNumber(mem.swapused);
  const total = safeNumber(mem.swaptotal);
  return {
    used,
    total,
    percent: total > 0 ? (used / total) * 100 : 0,
  };
}

function summarizeDisk(disks) {
  const totals = disks.reduce(
    (acc, disk) => {
      acc.used += safeNumber(disk.used);
      acc.total += safeNumber(disk.size);
      return acc;
    },
    { used: 0, total: 0 }
  );
  return {
    used: totals.used,
    total: totals.total,
    percent: totals.total > 0 ? (totals.used / totals.total) * 100 : 0,
  };
}

function summarizeNetwork(stats) {
  const totals = stats.reduce(
    (acc, stat) => {
      acc.rx += safeNumber(stat.rx_sec ?? stat.rx_bytes);
      acc.tx += safeNumber(stat.tx_sec ?? stat.tx_bytes);
      acc.rxBytes += safeNumber(stat.rx_bytes);
      acc.txBytes += safeNumber(stat.tx_bytes);
      return acc;
    },
    { rx: 0, tx: 0, rxBytes: 0, txBytes: 0 }
  );
  return {
    rxSec: totals.rx || totals.rxBytes,
    txSec: totals.tx || totals.txBytes,
  };
}

function getServiceList() {
  const raw = process.env.DASHBOARD_SERVICES || "apache2,nginx,mysql,mariadb,postgresql,redis,pm2";
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

async function getServices() {
  const names = getServiceList();
  if (names.length === 0) return [];
  try {
    const result = await si.services(names);
    const list = Array.isArray(result) ? result : [];
    const normalize = (value) => (value || "").toString().toLowerCase();
    return names.map((name) => {
      const target = normalize(name);
      const service =
        list.find((item) => normalize(item.name) === target) ||
        list.find(
          (item) =>
            normalize(item.name).includes(target) ||
            target.includes(normalize(item.name))
        );
      if (!service) {
        return {
          name,
          status: "unknown",
          since: null,
          detail: "service not found",
        };
      }
      return {
        name: service.name || name,
        status: service.running ? "running" : "stopped",
        since: service.started || null,
        detail: service.details || service.desc || "",
      };
    });
  } catch (error) {
    return names.map((name) => ({
      name,
      status: "unknown",
      since: null,
      detail: "service lookup failed",
    }));
  }
}

function normalizeProcesses(procData) {
  const list = procData.list || [];
  const sortedCpu = [...list].sort((a, b) => b.cpu - a.cpu).slice(0, 8);
  const sortedMem = [...list].sort((a, b) => b.mem - a.mem).slice(0, 8);
  const mapProcess = (proc) => ({
    pid: proc.pid,
    name: proc.name,
    cpu: safeNumber(proc.cpu),
    mem: safeNumber(proc.mem),
    memRss: safeNumber(proc.memRss),
    user: proc.user,
    path: proc.path,
    state: proc.state,
  });
  return {
    total: procData.all,
    running: procData.running,
    blocked: procData.blocked,
    sleeping: procData.sleeping,
    topCpu: sortedCpu.map(mapProcess),
    topMem: sortedMem.map(mapProcess),
  };
}

async function getPidUsage() {
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

export async function getMetrics() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < getCacheTtlMs()) {
    return cache.data;
  }

  const [
    cpu,
    currentLoad,
    mem,
    fsSize,
    fsStats,
    disksIO,
    netStats,
    netIfaces,
    osInfo,
    system,
    time,
    procData,
    pidTargets,
    services,
    health,
  ] = await Promise.all([
    safe(si.cpu(), { brand: "", cores: 0, physicalCores: 0, speed: 0 }),
    safe(si.currentLoad(), { currentLoad: 0 }),
    safe(si.mem(), { total: 0, used: 0, swaptotal: 0, swapused: 0 }),
    safe(si.fsSize(), []),
    safe(si.fsStats(), { rx: 0, wx: 0, tx: 0 }),
    safe(si.disksIO(), { rIO: 0, wIO: 0, tIO: 0, rBytes: 0, wBytes: 0 }),
    safe(si.networkStats(), []),
    safe(si.networkInterfaces(), []),
    safe(si.osInfo(), { hostname: "", distro: "", kernel: "", arch: "" }),
    safe(si.system(), { model: "", manufacturer: "", serial: "" }),
    safe(si.time(), { uptime: 0 }),
    safe(si.processes(), { list: [], all: 0, running: 0, blocked: 0, sleeping: 0 }),
    getPidUsage(),
    getServices(),
    getHealthChecks(),
  ]);

  const loadAverages = os.loadavg();
  const summary = {
    cpuPercent: safeNumber(currentLoad.currentLoad),
    load: [
      safeNumber(loadAverages[0]),
      safeNumber(loadAverages[1]),
      safeNumber(loadAverages[2]),
    ],
    mem: summarizeMemory(mem),
    swap: summarizeSwap(mem),
    disk: summarizeDisk(fsSize),
    network: summarizeNetwork(netStats),
    uptimeSec: safeNumber(time.uptime),
  };

  const storage = fsSize.map((disk) => ({
    fs: disk.fs,
    type: disk.type,
    mount: disk.mount,
    size: safeNumber(disk.size),
    used: safeNumber(disk.used),
    use: safeNumber(disk.use),
  }));

  const network = netIfaces.map((iface) => {
    const stats = netStats.find((item) => item.iface === iface.iface) || {};
    return {
      iface: iface.iface,
      ip4: iface.ip4,
      ip6: iface.ip6,
      mac: iface.mac,
      type: iface.type,
      speed: iface.speed,
      rxSec: safeNumber(stats.rx_sec ?? stats.rx_bytes),
      txSec: safeNumber(stats.tx_sec ?? stats.tx_bytes),
      rxBytes: safeNumber(stats.rx_bytes),
      txBytes: safeNumber(stats.tx_bytes),
    };
  });

  const processes = {
    ...normalizeProcesses(procData),
    targeted: pidTargets,
  };

  const data = {
    timestamp: now,
    summary,
    system: {
      hostname: osInfo.hostname,
      os: osInfo.distro,
      kernel: osInfo.kernel,
      arch: osInfo.arch,
      cpu: {
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
      },
      platform: system.model,
      manufacturer: system.manufacturer,
      serial: system.serial,
    },
    storage: {
      disks: storage,
      fsStats: {
        rx: safeNumber(fsStats.rx),
        wx: safeNumber(fsStats.wx),
        tx: safeNumber(fsStats.tx),
      },
      diskIO: {
        rIO: safeNumber(disksIO.rIO),
        wIO: safeNumber(disksIO.wIO),
        tIO: safeNumber(disksIO.tIO),
        rBytes: safeNumber(disksIO.rBytes),
        wBytes: safeNumber(disksIO.wBytes),
      },
    },
    network,
    processes,
    services,
    health,
  };

  cache.timestamp = now;
  cache.data = data;
  return data;
}

export async function getSummary() {
  const now = Date.now();
  if (summaryCache.data && now - summaryCache.timestamp < getCacheTtlMs()) {
    return summaryCache.data;
  }

  const [currentLoad, mem, fsSize, netStats, time] = await Promise.all([
    safe(si.currentLoad(), { currentLoad: 0 }),
    safe(si.mem(), { total: 0, used: 0, swaptotal: 0, swapused: 0 }),
    safe(si.fsSize(), []),
    safe(si.networkStats(), []),
    safe(si.time(), { uptime: 0 }),
  ]);

  const summaryLoads = os.loadavg();
  const summary = {
    cpuPercent: safeNumber(currentLoad.currentLoad),
    load: [
      safeNumber(summaryLoads[0]),
      safeNumber(summaryLoads[1]),
      safeNumber(summaryLoads[2]),
    ],
    mem: summarizeMemory(mem),
    swap: summarizeSwap(mem),
    disk: summarizeDisk(fsSize),
    network: summarizeNetwork(netStats),
    uptimeSec: safeNumber(time.uptime),
  };

  const data = { timestamp: now, summary };
  summaryCache.timestamp = now;
  summaryCache.data = data;
  return data;
}

export async function getSystem() {
  const now = Date.now();
  if (systemCache.data && now - systemCache.timestamp < getDetailCacheTtlMs()) {
    return systemCache.data;
  }

  const [cpu, cpuTemp, osInfo, system] = await Promise.all([
    safe(si.cpu(), { brand: "", cores: 0, physicalCores: 0, speed: 0 }),
    safe(si.cpuTemperature(), { main: null, cores: [] }),
    safe(si.osInfo(), { hostname: "", distro: "", kernel: "", arch: "" }),
    safe(si.system(), { model: "", manufacturer: "", serial: "" }),
  ]);

  const data = {
    timestamp: now,
    system: {
      hostname: osInfo.hostname,
      os: osInfo.distro,
      kernel: osInfo.kernel,
      arch: osInfo.arch,
      cpu: {
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
        temperature: {
          main: cpuTemp.main,
          cores: cpuTemp.cores,
        },
      },
      platform: system.model,
      manufacturer: system.manufacturer,
      serial: system.serial,
    },
  };

  systemCache.timestamp = now;
  systemCache.data = data;
  return data;
}

export async function getStorage() {
  const now = Date.now();
  if (storageCache.data && now - storageCache.timestamp < getDetailCacheTtlMs()) {
    return storageCache.data;
  }

  const [fsSize, fsStats, disksIO] = await Promise.all([
    safe(si.fsSize(), []),
    safe(si.fsStats(), { rx: 0, wx: 0, tx: 0 }),
    safe(si.disksIO(), { rIO: 0, wIO: 0, tIO: 0, rBytes: 0, wBytes: 0 }),
  ]);

  const data = {
    timestamp: now,
    storage: {
      disks: fsSize.map((disk) => ({
        fs: disk.fs,
        type: disk.type,
        mount: disk.mount,
        size: safeNumber(disk.size),
        used: safeNumber(disk.used),
        use: safeNumber(disk.use),
      })),
      fsStats: {
        rx: safeNumber(fsStats.rx),
        wx: safeNumber(fsStats.wx),
        tx: safeNumber(fsStats.tx),
      },
      diskIO: {
        rIO: safeNumber(disksIO.rIO),
        wIO: safeNumber(disksIO.wIO),
        tIO: safeNumber(disksIO.tIO),
        rBytes: safeNumber(disksIO.rBytes),
        wBytes: safeNumber(disksIO.wBytes),
      },
    },
  };

  storageCache.timestamp = now;
  storageCache.data = data;
  return data;
}

export async function getNetwork() {
  const now = Date.now();
  if (networkCache.data && now - networkCache.timestamp < getDetailCacheTtlMs()) {
    return networkCache.data;
  }

  const [netIfaces, netStats] = await Promise.all([
    safe(si.networkInterfaces(), []),
    safe(si.networkStats(), []),
  ]);

  const network = netIfaces.map((iface) => {
    const stats = netStats.find((item) => item.iface === iface.iface) || {};
    return {
      iface: iface.iface,
      ip4: iface.ip4,
      ip6: iface.ip6,
      mac: iface.mac,
      type: iface.type,
      speed: iface.speed,
      rxSec: safeNumber(stats.rx_sec ?? stats.rx_bytes),
      txSec: safeNumber(stats.tx_sec ?? stats.tx_bytes),
      rxBytes: safeNumber(stats.rx_bytes),
      txBytes: safeNumber(stats.tx_bytes),
    };
  });

  const data = {
    timestamp: now,
    network,
    summary: summarizeNetwork(netStats),
  };

  networkCache.timestamp = now;
  networkCache.data = data;
  return data;
}

export async function getProcesses() {
  const metrics = await getMetrics();
  return {
    timestamp: metrics.timestamp,
    processes: metrics.processes,
  };
}

export async function getServicesSummary() {
  const now = Date.now();
  if (servicesCache.data && now - servicesCache.timestamp < getDetailCacheTtlMs()) {
    return servicesCache.data;
  }
  const services = await getServices();
  const data = { timestamp: now, services };
  servicesCache.timestamp = now;
  servicesCache.data = data;
  return data;
}

export async function getHealthSummary() {
  const now = Date.now();
  if (healthCache.data && now - healthCache.timestamp < getDetailCacheTtlMs()) {
    return healthCache.data;
  }
  const health = await getHealthChecks();
  const data = { timestamp: now, health };
  healthCache.timestamp = now;
  healthCache.data = data;
  return data;
}

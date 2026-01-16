import fs from "fs/promises";
import path from "path";

const cache = {
  timestamp: 0,
  data: null,
};

function getCacheTtlMs() {
  const ttl = Number.parseInt(process.env.LOGS_CACHE_MS || "5000", 10);
  return Number.isFinite(ttl) ? ttl : 5000;
}

function getMaxLines() {
  const lines = Number.parseInt(process.env.DASHBOARD_LOG_TAIL_LINES || "40", 10);
  return Number.isFinite(lines) ? Math.max(lines, 5) : 40;
}

function getMaxBytes() {
  const bytes = Number.parseInt(process.env.DASHBOARD_LOG_MAX_BYTES || "204800", 10);
  return Number.isFinite(bytes) ? Math.max(bytes, 10240) : 204800;
}

function parseTargets() {
  const raw = process.env.DASHBOARD_LOG_FILES || "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((entry) => {
      if (entry.includes(":")) {
        const [name, filePath] = entry.split(/:(.+)/);
        return {
          name: name || path.basename(filePath || ""),
          path: filePath || "",
        };
      }
      return {
        name: path.basename(entry),
        path: entry,
      };
    })
    .filter((item) => item.path);
}

async function readTailLines(filePath, maxLines, maxBytes) {
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) {
    throw new Error("not_a_file");
  }
  const length = Math.min(stat.size, maxBytes);
  const start = Math.max(0, stat.size - length);
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);
    const text = buffer.toString("utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    return lines.slice(-maxLines);
  } finally {
    await handle.close();
  }
}

function countErrors(lines) {
  return lines.reduce((acc, line) => acc + (/error/i.test(line) ? 1 : 0), 0);
}

export async function getLogsSummary() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < getCacheTtlMs()) {
    return cache.data;
  }

  const targets = parseTargets();
  if (targets.length === 0) {
    const data = { timestamp: now, logs: [], totalErrors: 0 };
    cache.timestamp = now;
    cache.data = data;
    return data;
  }

  const maxLines = getMaxLines();
  const maxBytes = getMaxBytes();

  const logs = await Promise.all(
    targets.map(async (target) => {
      try {
        const lines = await readTailLines(target.path, maxLines, maxBytes);
        const errorCount = countErrors(lines);
        return {
          name: target.name,
          path: target.path,
          lines,
          errorCount,
          ok: true,
        };
      } catch (error) {
        return {
          name: target.name,
          path: target.path,
          lines: [],
          errorCount: 0,
          ok: false,
          error: "unavailable",
        };
      }
    })
  );

  const totalErrors = logs.reduce((acc, item) => acc + (item.errorCount || 0), 0);
  const data = { timestamp: now, logs, totalErrors };
  cache.timestamp = now;
  cache.data = data;
  return data;
}

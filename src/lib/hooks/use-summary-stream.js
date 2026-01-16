"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_KEY, DEFAULT_REFRESH_MS } from "@/lib/client-config";

export function useSummaryStream({ interval = DEFAULT_REFRESH_MS } = {}) {
  const base = Number.isFinite(interval) ? interval : DEFAULT_REFRESH_MS;
  const safeInterval = Math.min(Math.max(base, 500), 5000);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const fallbackRef = useRef(null);
  const lastTimestampRef = useRef(null);

  const url = useMemo(() => {
    if (typeof window === "undefined") return "";
    const endpoint = new URL("/api/stream", window.location.origin);
    if (API_KEY) endpoint.searchParams.set("key", API_KEY);
    endpoint.searchParams.set("interval", String(safeInterval));
    return endpoint.toString();
  }, [safeInterval]);

  useEffect(() => {
    if (!url) return undefined;
    let source;
    let stopped = false;

    const startFallback = () => {
      if (fallbackRef.current || stopped) return;
      const poll = async () => {
        try {
          const headers = {};
          if (API_KEY) headers["x-api-key"] = API_KEY;
          const res = await fetch(`/api/metrics/summary`, {
            headers,
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`Polling failed (${res.status})`);
          const json = await res.json();
          if (json?.timestamp && json.timestamp !== lastTimestampRef.current) {
            lastTimestampRef.current = json.timestamp;
            setSummary(json);
          }
          setConnected(true);
          setError(null);
        } catch (err) {
          setError(err);
          setConnected(false);
        }
      };
      poll();
      fallbackRef.current = setInterval(poll, safeInterval);
    };

    try {
      source = new EventSource(url);
      source.onopen = () => {
        setConnected(true);
      };
      source.onmessage = (event) => {
        if (event.data) {
          const parsed = JSON.parse(event.data);
          if (parsed?.error) {
            setError(new Error(parsed.error));
            setConnected(false);
            source.close();
            startFallback();
            return;
          }
          if (parsed?.timestamp && parsed.timestamp !== lastTimestampRef.current) {
            lastTimestampRef.current = parsed.timestamp;
            setSummary(parsed);
          }
          setError(null);
        }
      };
      source.onerror = () => {
        setConnected(false);
        source.close();
        startFallback();
      };
    } catch (err) {
      setError(err);
      startFallback();
    }

    return () => {
      stopped = true;
      if (source) source.close();
      if (fallbackRef.current) clearInterval(fallbackRef.current);
      fallbackRef.current = null;
    };
  }, [url, safeInterval]);

  return { summary, error, connected };
}

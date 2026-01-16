"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_KEY } from "@/lib/client-config";

export function useApi(path, { interval = 5000, immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const inFlightRef = useRef(false);
  const loadingRef = useRef(immediate);

  const fetchData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      if (!loadingRef.current) {
        loadingRef.current = true;
        setLoading(true);
      }
      const headers = {};
      if (API_KEY) headers["x-api-key"] = API_KEY;
      const res = await fetch(path, {
        headers,
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [path]);

  useEffect(() => {
    if (!immediate) return undefined;
    fetchData();
    if (!interval) return undefined;
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [fetchData, immediate, interval]);

  return { data, error, loading, refresh: fetchData };
}

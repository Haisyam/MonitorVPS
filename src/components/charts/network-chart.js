"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatTick(value) {
  if (typeof value === "number") return value.toFixed(0);
  return value;
}

export default function NetworkChart({ data }) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis dataKey="time" hide />
          <YAxis hide tickFormatter={formatTick} />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 12,
              color: "#e2e8f0",
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Line type="monotone" dataKey="rx" stroke="#60a5fa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="tx" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

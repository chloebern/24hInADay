"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

type Row = { id: string; name: string; color: string; minutes: number };

export default function StatsChart({ rows }: { rows: Row[] }) {
  const data = rows
    .filter((r) => r.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .map((r) => ({ ...r, hours: Math.round((r.minutes / 60) * 10) / 10 }));

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm text-neutral-400">
        No entries in this period.
      </div>
    );
  }

  const height = Math.max(data.length * 40, 120);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} stroke="#e1e0d9" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#898781" }}
            axisLine={{ stroke: "#c3c2b7" }}
            tickLine={false}
            unit="h"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 13, fill: "#0b0b0b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}h`, "Tracked"]}
            contentStyle={{
              fontSize: 13,
              borderRadius: 8,
              border: "1px solid #e1e0d9",
            }}
          />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((row) => (
              <Cell key={row.id} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

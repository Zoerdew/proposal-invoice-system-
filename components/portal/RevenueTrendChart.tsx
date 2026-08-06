"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { label: string; revenue: number };

export default function RevenueTrendChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-[#0a0608]/50 py-6">
        No check-ins logged yet — the revenue trend will appear here once you
        have some.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#0a0608" strokeOpacity={0.08} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#0a0608", fillOpacity: 0.5, fontSize: 12 }}
            axisLine={{ stroke: "#0a0608", strokeOpacity: 0.15 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#0a0608", fillOpacity: 0.5, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => `£${v}`}
          />
          <Tooltip
            formatter={(value: number) => [`£${value.toLocaleString()}`, "Revenue"]}
            contentStyle={{
              background: "#FAF3E9",
              border: "1px solid rgba(10,6,8,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#F11787"
            strokeWidth={2}
            dot={{ r: 3, fill: "#F11787", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

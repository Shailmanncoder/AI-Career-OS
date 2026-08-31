"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type CareerDatum = {
  role: string;
  score: number;
};

export function CareerComparison({ data }: { data: CareerDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No career matches calculated yet.
      </div>
    );
  }

  return (
    <div style={{ height: Math.max(220, data.length * 44) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="role"
            width={150}
            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            formatter={(value: number) => [`${value}%`, "Compatibility"]}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 10,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((entry, index) => (
              <Cell
                key={entry.role}
                fill={index === 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-1) / 0.4)"}
              />
            ))}
            <LabelList
              dataKey="score"
              position="right"
              formatter={(value: number) => `${value}%`}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

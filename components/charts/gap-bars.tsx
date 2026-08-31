"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GapDatum = {
  skill: string;
  current: number;
  required: number;
  gap: number;
  priority: string;
};

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "hsl(var(--destructive))",
  MEDIUM: "hsl(var(--warning))",
  LOW: "hsl(var(--chart-2))",
};

export function GapBars({ data }: { data: GapDatum[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No remaining skill gaps for this role.
      </div>
    );
  }

  return (
    <div style={{ height: Math.max(240, data.length * 42) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="skill"
            width={130}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 10,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
          />
          <Bar dataKey="current" name="Your level" radius={[0, 4, 4, 0]} barSize={12}>
            {data.map((entry) => (
              <Cell key={entry.skill} fill="hsl(var(--chart-1))" />
            ))}
          </Bar>
          <Bar dataKey="gap" name="Gap to close" radius={[0, 4, 4, 0]} barSize={12}>
            {data.map((entry) => (
              <Cell key={entry.skill} fill={PRIORITY_COLOR[entry.priority] ?? "hsl(var(--muted-foreground))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

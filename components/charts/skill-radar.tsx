"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type SkillRadarDatum = {
  category: string;
  candidate: number;
  required: number;
};

export function SkillRadar({ data }: { data: SkillRadarDatum[] }) {
  if (data.length < 3) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        At least three skill categories are needed to draw the radar.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Role expectation"
            dataKey="required"
            stroke="hsl(var(--muted-foreground))"
            fill="hsl(var(--muted-foreground))"
            fillOpacity={0.12}
            strokeDasharray="4 4"
          />
          <Radar
            name="Your level"
            dataKey="candidate"
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.34}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 10,
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

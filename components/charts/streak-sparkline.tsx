"use client";

export type SparkPoint = { label: string; value: number };

export function StreakSparkline({
  data,
  width = 180,
  height = 52,
}: {
  data: SparkPoint[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) {
    return <div style={{ width, height }} aria-hidden="true" />;
  }

  const max = Math.max(1, ...data.map((point) => point.value));
  const step = width / (data.length - 1);
  const points = data.map((point, index) => ({
    x: index * step,
    y: height - (point.value / max) * (height - 8) - 4,
  }));

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Activity over the last ${data.length} days`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="streakFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#streakFill)" />
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--chart-1))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

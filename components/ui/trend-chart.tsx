"use client";

import { useId, useState } from "react";

type Point = { label: string; value: number };

/**
 * Dependency-free inline SVG chart (bar or line). Built instead of pulling in
 * a charting library — the app has no chart dependency anywhere else and
 * this only needs simple trend visualization, not interactive analytics.
 */
export function TrendChart({
  data,
  mode = "bar",
  height = 160,
  formatValue,
  color = "var(--color-gocs-red, #dc2626)",
}: {
  data: Point[];
  mode?: "bar" | "line";
  height?: number;
  formatValue?: (v: number) => string;
  color?: string;
}) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos suficientes todavía.</p>;
  }

  const width = 600;
  const padding = 24;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  function yFor(v: number) {
    return padding + innerH - ((v - min) / range) * innerH;
  }

  const linePoints = data.map((d, i) => `${padding + i * stepX},${yFor(d.value)}`).join(" ");
  const fmt = formatValue ?? ((v: number) => String(Math.round(v)));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[420px]" role="img">
        <line
          x1={padding}
          y1={yFor(0)}
          x2={width - padding}
          y2={yFor(0)}
          stroke="currentColor"
          strokeOpacity={0.15}
        />
        {mode === "bar" ? (
          data.map((d, i) => {
            const barW = Math.max(4, (innerW / data.length) * 0.6);
            const x = padding + i * (innerW / Math.max(1, data.length - 1 || 1)) - barW / 2;
            const barX = data.length === 1 ? width / 2 - barW / 2 : x;
            const y = Math.min(yFor(d.value), yFor(0));
            const h = Math.abs(yFor(d.value) - yFor(0));
            return (
              <rect
                key={i}
                x={barX}
                y={y}
                width={barW}
                height={Math.max(1, h)}
                fill={color}
                opacity={hoverIndex === null || hoverIndex === i ? 0.85 : 0.35}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })
        ) : (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <polygon
              points={`${padding},${yFor(0)} ${linePoints} ${padding + (data.length - 1) * stepX},${yFor(0)}`}
              fill={`url(#${gradientId})`}
            />
            <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2} />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={padding + i * stepX}
                cy={yFor(d.value)}
                r={hoverIndex === i ? 4 : 2.5}
                fill={color}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.label}</span>
        {hoverIndex !== null && (
          <span className="font-medium text-foreground">
            {data[hoverIndex].label}: {fmt(data[hoverIndex].value)}
          </span>
        )}
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

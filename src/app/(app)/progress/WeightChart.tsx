"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

interface WeightChartProps {
  weights: Array<{ date: string; weight: number }>;
  target?: number;
  start?: number;
}

export function WeightChart({ weights, target, start }: WeightChartProps) {
  if (weights.length < 2) return null;

  const data = weights.map((w) => ({
    date: format(new Date(w.date), "MMM d"),
    weight: w.weight,
  }));

  const allWeights = weights.map((w) => w.weight);
  const minWeight = Math.min(...allWeights, target || Infinity) - 1;
  const maxWeight = Math.max(...allWeights, start || 0) + 1;

  return (
    <div className="mt-3 h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minWeight, maxWeight]}
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--color-foreground)",
            }}
            formatter={(value: number) => [`${value}kg`, "Weight"]}
          />
          {target && (
            <ReferenceLine
              y={target}
              stroke="var(--color-success)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--color-weight)"
            strokeWidth={2}
            dot={{ fill: "var(--color-weight)", strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

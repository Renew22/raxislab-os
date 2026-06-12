"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useTheme } from "./theme-provider";

type Props = {
  data: number[];
  id: string;
};

export default function SparkLine({ data, id }: Props) {
  const { theme } = useTheme();
  const color = theme === "dark" ? "#00C8FF" : "#0066FF";
  const chartData = data.map(v => ({ v }));
  const gradId = `spark-${id}`;

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

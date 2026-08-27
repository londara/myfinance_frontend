"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SeriesPoint } from "@/lib/api/types";
import { currency, currencyAxis } from "@/lib/format";
import { viz } from "@/lib/viz";

const config = {
  amount: { label: "Spending", color: viz.brand },
} satisfies ChartConfig;

/**
 * The running spend curve for the current month.
 *
 * The 1W / 1M / 1Y switch the fixture version had is gone: `/api/dashboard` serves the current
 * month only. Restoring it means a range parameter on the backend endpoint, not a client-side
 * slice — the series is a running total, so cutting it locally would misreport the starting point.
 */
export function SpendingOverview({ series }: { series: SeriesPoint[] }) {
  return (
    <SectionCard className="flex flex-col">
      <SectionHeader
        title="Spending Overview"
        description="Running total this month"
      />

      {series.length === 0 ? (
        <p className="mt-8 mb-8 text-center text-body-md text-on-surface-variant">
          No spending recorded this month yet.
        </p>
      ) : (
        <ChartContainer config={config} className="mt-6 aspect-auto h-56 w-full">
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={viz.brand} stopOpacity={0.2} />
                <stop offset="100%" stopColor={viz.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={viz.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(value: number) => currencyAxis(value)}
            />
            <ChartTooltip
              cursor={{ stroke: viz.grid, strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => currency(Number(value))}
                />
              }
            />
            <Area
              dataKey="amount"
              type="monotone"
              stroke={viz.brand}
              strokeWidth={2}
              fill="url(#spendingFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: viz.surface }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Cashflow } from "@/lib/api/types";
import { currency, currencyAxis, currencyRound } from "@/lib/format";
import { viz } from "@/lib/viz";

/**
 * One measure across three labelled positions. Identity comes from the x-axis; the fills carry the
 * reserved status meaning (money in / money out) and every bar is directly labelled, so nothing
 * depends on colour alone.
 */
const FILL = {
  Income: viz.good,
  Expenses: viz.critical,
  Savings: viz.brand,
} as const;

const config = { amount: { label: "Amount" } } satisfies ChartConfig;

export function CashflowChart({ cashflow }: { cashflow: Cashflow }) {
  const data = [
    { label: "Income", amount: cashflow.income, fill: FILL.Income },
    { label: "Expenses", amount: cashflow.expenses, fill: FILL.Expenses },
    { label: "Savings", amount: cashflow.savings, fill: FILL.Savings },
  ];

  return (
    <SectionCard className="flex flex-col">
      <SectionHeader
        title="Income vs Expenses vs Savings"
        description="This month, in dollars"
      />

      <ChartContainer config={config} className="mt-6 aspect-auto h-56 w-full">
        <BarChart data={data} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={viz.grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(value: number) => currencyAxis(value)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value) => currency(Number(value))}
              />
            }
          />
          <Bar
            dataKey="amount"
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="amount"
              position="top"
              offset={10}
              className="tnum fill-on-surface text-label-md font-semibold"
              formatter={(value: unknown) => currencyRound(Number(value))}
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border pt-4">
        {data.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-label-md text-on-surface-variant">{entry.label}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

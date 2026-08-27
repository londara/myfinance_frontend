"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

import { Money } from "@/components/shared/money";
import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CashflowPoint, NetWorthReport, SpendingTrend } from "@/lib/api/types";
import { currency, currencyAxis } from "@/lib/format";
import { viz } from "@/lib/viz";

/** Shown instead of an axis-only chart when a series has no points. */
function EmptySeries({ message }: { message: string }) {
  return (
    <p className="my-10 text-center text-body-md text-on-surface-variant">{message}</p>
  );
}

/* ---------------------------------------------------------------- net worth */

const netWorthConfig = {
  value: { label: "Net worth", color: viz.brand },
} satisfies ChartConfig;

export function NetWorthCard({ report }: { report: NetWorthReport }) {
  return (
    <SectionCard className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          title="Year-to-Date Net Worth"
          description="Total assets minus liabilities"
        />
        <div className="text-right">
          <Money value={report.total} className="block text-headline-md text-brand" />
          {report.yearOverYear ? (
            <span className="mt-1 inline-flex items-center gap-1 text-label-md text-success">
              <TrendingUp className="size-4" aria-hidden />
              {report.yearOverYear}
            </span>
          ) : null}
        </div>
      </div>

      {report.series.length === 0 ? (
        <EmptySeries
          message="No balance history yet. Snapshots are written nightly, so this fills in from tomorrow."
        />
      ) : (
        <ChartContainer config={netWorthConfig} className="mt-6 aspect-auto h-64 w-full">
          <AreaChart data={report.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
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
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              domain={["dataMin - 10000", "dataMax + 5000"]}
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
              dataKey="value"
              type="monotone"
              stroke={viz.brand}
              strokeWidth={2}
              fill="url(#netWorthFill)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: viz.surface }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------- monthly spending */

const spendingConfig = {
  value: { label: "Spending", color: viz.brandSoft },
} satisfies ChartConfig;

export function MonthlySpendingCard({ trend }: { trend: SpendingTrend }) {
  return (
    <SectionCard className="flex h-full flex-col">
      <SectionHeader title="Monthly Spending" description="30-day trailing trend" />

      {trend.series.length === 0 ? (
        <EmptySeries message="No spending in the last 30 days." />
      ) : (
        <ChartContainer config={spendingConfig} className="mt-4 aspect-auto h-40 w-full">
          <LineChart data={trend.series} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
            <CartesianGrid vertical={false} stroke={viz.grid} strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ stroke: viz.grid, strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => currency(Number(value))}
                />
              }
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke={viz.brandSoft}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: viz.surface }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      )}

      <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <dt className="text-label-md text-slate-ink uppercase">Total spend</dt>
          <dd>
            <Money value={trend.total} className="text-title-lg text-brand" />
          </dd>
        </div>
        <div>
          <dt className="text-label-md text-slate-ink uppercase">Avg / day</dt>
          <dd>
            <Money value={trend.perDay} className="text-title-lg text-brand" />
          </dd>
        </div>
      </dl>
    </SectionCard>
  );
}

/* ------------------------------------------------------ income vs expenses */

const cashflowConfig = {
  income: { label: "Income", color: viz.good },
  expenses: { label: "Expenses", color: viz.critical },
} satisfies ChartConfig;

export function IncomeVsExpensesCard({ points }: { points: CashflowPoint[] }) {
  return (
    <SectionCard className="flex h-full flex-col">
      <SectionHeader
        title="Income vs. Expenses"
        description="Last five months"
        action={
          <ul className="flex items-center gap-4">
            {Object.entries(cashflowConfig).map(([key, entry]) => (
              <li key={key} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-label-md text-on-surface-variant">
                  {entry.label}
                </span>
              </li>
            ))}
          </ul>
        }
      />

      {points.length === 0 ? (
        <EmptySeries message="No activity in this period." />
      ) : (
        <ChartContainer config={cashflowConfig} className="mt-6 aspect-auto h-56 w-full">
          <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
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
                <ChartTooltipContent formatter={(value) => currency(Number(value))} />
              }
            />
            <Bar
              dataKey="income"
              fill={viz.good}
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
              isAnimationActive={false}
            />
            <Bar
              dataKey="expenses"
              fill={viz.critical}
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

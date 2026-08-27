"use client";

import { Cell, Pie, PieChart } from "recharts";

import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CategorySlice } from "@/lib/api/types";
import { currency, percent } from "@/lib/format";
import { viz } from "@/lib/viz";

export function CategoryBreakdown({ slices }: { slices: CategorySlice[] }) {
  /*
   * Colours are assigned here by position, from the validated fixed-order palette, rather than
   * using the `color` the backend stores per category. Two reasons: the slot order is what the
   * colourblind-separation validation was run against, and the tail is already folded into a
   * single "Other" arc server-side, so at most five slots are ever needed.
   */
  const data = slices.map((slice, index) => ({
    ...slice,
    fill: viz.series[index % viz.series.length],
  }));

  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);

  const config = Object.fromEntries(
    data.map((entry) => [entry.label, { label: entry.label, color: entry.fill }]),
  ) satisfies ChartConfig;

  if (data.length === 0) {
    return (
      <SectionCard className="flex flex-col">
        <SectionHeader
          title="Spending by Category"
          description="Share of this month's expenses"
        />
        <p className="mt-8 mb-8 text-center text-body-md text-on-surface-variant">
          No spending recorded this month yet.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="flex flex-col">
      <SectionHeader
        title="Spending by Category"
        description="Share of this month's expenses"
      />

      <div className="relative mt-4 self-center">
        <ChartContainer config={config} className="aspect-square h-44 w-44">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="label"
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-4">
                      <span>{name}</span>
                      <span className="tnum font-semibold">
                        {currency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey="amount"
              nameKey="label"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={2}
              stroke={viz.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-label-md text-on-surface-variant">Spent</span>
          <span className="tnum text-title-md text-brand">{currency(total)}</span>
        </div>
      </div>

      {/* Direct labels — the required relief for the palette slots below 3:1 on white. */}
      <ul className="mt-6 flex flex-col gap-3">
        {data.map((entry) => (
          <li key={entry.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="truncate text-body-md text-on-surface">{entry.label}</span>
            </span>
            <span className="tnum shrink-0 text-data text-on-surface-variant">
              {percent(entry.share)}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

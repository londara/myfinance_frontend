import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

import { Money, TrendDelta } from "@/components/shared/money";
import type { SummaryTiles } from "@/lib/api/types";

/**
 * The four hero numbers. No plot, so no chart — a stat tile is the right form.
 *
 * Deltas arrive from the server as pre-formatted strings ("+8.2%") because the backend is the only
 * side that knows the prior period. They are optional: SCHEMA.md notes that a balance delta needs
 * snapshot history, so the backend omits it rather than inventing one, and this renders nothing
 * instead of "NaN%".
 */
type Tile = {
  label: string;
  value: number;
  icon: LucideIcon;
  delta?: string;
  trend: "up" | "down" | "neutral";
};

export function SummaryCards({ summary }: { summary: SummaryTiles }) {
  const tiles: Tile[] = [
    {
      label: "Total Balance",
      value: summary.totalBalance,
      icon: Landmark,
      delta: summary.balanceDelta,
      trend: "up",
    },
    {
      label: "Income",
      value: summary.income,
      icon: ArrowDownLeft,
      delta: summary.incomeDelta,
      trend: trendOf(summary.incomeDelta, "up"),
    },
    {
      label: "Expenses",
      value: summary.expenses,
      icon: ArrowUpRight,
      // More spending is bad news, so the arrow points the other way to the sign.
      delta: summary.expensesDelta,
      trend: trendOf(summary.expensesDelta, "down", true),
    },
    {
      label: "Savings",
      value: summary.savings,
      icon: PiggyBank,
      delta: summary.savingsRate,
      trend: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <article key={tile.label} className="fin-card-interactive p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h2 className="text-label-md text-slate-ink">{tile.label}</h2>
              <Icon className="size-4 shrink-0 text-slate-ink" aria-hidden />
            </div>
            <Money
              value={tile.value}
              className="mb-1 block text-headline-md text-brand"
            />
            {tile.delta ? (
              <TrendDelta trend={tile.trend}>{tile.delta}</TrendDelta>
            ) : (
              <span className="text-data text-on-surface-variant">
                No prior period
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}

/** Reads the sign off the server-formatted string, inverting it where up is bad. */
function trendOf(
  delta: string | undefined,
  fallback: "up" | "down",
  inverted = false,
): "up" | "down" | "neutral" {
  if (!delta) {
    return "neutral";
  }
  const rising = delta.trim().startsWith("+");
  if (inverted) {
    return rising ? "down" : "up";
  }
  return rising ? "up" : fallback === "up" ? "down" : "up";
}

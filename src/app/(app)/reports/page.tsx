import type { Metadata } from "next";
import {
  Car,
  HeartPulse,
  Home,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  IncomeVsExpensesCard,
  MonthlySpendingCard,
  NetWorthCard,
} from "@/components/reports/report-charts";
import { Money } from "@/components/shared/money";
import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import {
  getIncomeVsExpenses,
  getNetWorth,
  getSpendingTrend,
  getTopCategories,
} from "@/lib/api/queries";
import { percent } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  restaurant: UtensilsCrossed,
  car: Car,
  health: HeartPulse,
};

export default async function ReportsPage() {
  // Four independent aggregates, fetched concurrently, so the page costs the slowest one rather
  // than the sum of all four — the same reasoning the backend applies inside /api/dashboard.
  const [netWorth, cashflow, trend, topCategories] = await Promise.all([
    getNetWorth(),
    getIncomeVsExpenses(5),
    getSpendingTrend(30),
    getTopCategories(8),
  ]);

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
      <div className="lg:col-span-8">
        <NetWorthCard report={netWorth} />
      </div>
      <div className="lg:col-span-4">
        <MonthlySpendingCard trend={trend} />
      </div>

      <div className="lg:col-span-6">
        <IncomeVsExpensesCard points={cashflow} />
      </div>

      <div className="lg:col-span-6">
        <SectionCard className="flex h-full flex-col">
          <SectionHeader
            title="Top Categories"
            description="Where the money went this month"
          />

          {topCategories.length === 0 ? (
            <p className="mt-6 text-body-md text-on-surface-variant">
              No spending recorded this month yet.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {topCategories.map((category) => {
                const Icon = ICONS[category.icon ?? ""] ?? Wallet;
                return (
                  <li
                    key={category.label}
                    className="group flex items-center justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-low text-slate-ink transition-colors group-hover:bg-brand-fixed group-hover:text-brand">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <p className="truncate text-title-md text-on-surface">
                        {category.label}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Money value={category.amount} className="block text-on-surface" />
                      <span className="tnum text-label-md text-on-surface-variant">
                        {percent(category.share)} of spend
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

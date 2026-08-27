import type { Metadata } from "next";

import {
  GoalsSnapshotCard,
  MonthlyBudgetCard,
} from "@/components/dashboard/budget-and-goals";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SpendingOverview } from "@/components/dashboard/spending-overview";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { getDashboard } from "@/lib/api/queries";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * A Server Component. One `await` fetches the whole dashboard, and the HTML ships with the numbers
 * already in it — no loading spinner on first paint, no client-side data layer.
 *
 * The backend deliberately serves this as ONE endpoint rather than seven, so this is one round trip
 * for eight read models. Splitting it would mean seven requests and a waterfall of spinners for a
 * screen that is useless until the last one lands.
 */
export default async function DashboardPage() {
  const dashboard = await getDashboard();

  return (
    <div className="flex flex-col gap-gutter">
      <SummaryCards summary={dashboard.summary} />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <SpendingOverview series={dashboard.spendingSeries} />
        <CashflowChart cashflow={dashboard.cashflow} />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <CategoryBreakdown slices={dashboard.categoryBreakdown} />
        <div className="lg:col-span-2">
          <UpcomingPayments payments={dashboard.upcomingPayments} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentTransactions transactions={dashboard.recentTransactions} />
        </div>
        <div className="flex flex-col gap-gutter">
          <MonthlyBudgetCard rollup={dashboard.monthlyBudget} />
          <GoalsSnapshotCard goals={dashboard.goals} />
        </div>
      </div>
    </div>
  );
}

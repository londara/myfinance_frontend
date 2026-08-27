import Link from "next/link";

import { Meter, budgetTone } from "@/components/shared/meter";
import { Money } from "@/components/shared/money";
import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import type { BudgetRollup, Goal } from "@/lib/api/types";
import { currency, percent } from "@/lib/format";

export function MonthlyBudgetCard({ rollup }: { rollup: BudgetRollup }) {
  const hasBudgets = rollup.limit > 0;

  return (
    <SectionCard>
      <SectionHeader title="Monthly Budget" />

      {hasBudgets ? (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <Money value={rollup.spent} className="text-title-lg text-brand" />
            <span className="text-label-md text-on-surface-variant">
              of {currency(rollup.limit)} total
            </span>
          </div>
          <Meter
            value={rollup.usedPercent}
            tone={budgetTone(rollup.spent, rollup.limit)}
            label="Monthly budget used"
            className="mt-3"
          />
          <p className="tnum mt-2 text-right text-data text-on-surface-variant">
            {percent(rollup.usedPercent, 1)} used
          </p>
        </>
      ) : (
        <p className="mt-3 text-body-md text-on-surface-variant">
          No budgets yet.{" "}
          <Link href="/budgets" className="text-brand-container hover:underline">
            Set a limit
          </Link>{" "}
          to track spending against it.
        </p>
      )}
    </SectionCard>
  );
}

export function GoalsSnapshotCard({ goals }: { goals: Goal[] }) {
  return (
    <SectionCard className="flex-1">
      <SectionHeader
        title="Financial Goals"
        action={
          <Button variant="link" size="sm" asChild>
            <Link href="/goals">View All</Link>
          </Button>
        }
      />

      {goals.length === 0 ? (
        <p className="mt-4 text-body-md text-on-surface-variant">
          No active goals yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {goals.map((goal) => (
            <li key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-label-md text-brand uppercase">
                  {goal.name}
                </span>
                <span className="tnum shrink-0 text-label-md text-on-surface-variant">
                  {percent(goal.percent)}
                </span>
              </div>
              <Meter
                value={goal.percent}
                tone={goal.percent >= 75 ? "good" : "brand"}
                label={`${goal.name} progress`}
              />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

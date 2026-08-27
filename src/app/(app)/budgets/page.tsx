import type { Metadata } from "next";
import {
  Car,
  Film,
  Home,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { BudgetCardActions } from "@/components/budgets/budget-card-actions";
import { CreateBudgetDialog } from "@/components/modals/create-budget-dialog";
import { Meter } from "@/components/shared/meter";
import { Money } from "@/components/shared/money";
import { SectionCard } from "@/components/shared/section-card";
import { getBudgetRollup, getBudgets, getCategories } from "@/lib/api/queries";
import type { BudgetTone } from "@/lib/api/types";
import { currency, percent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Budgets" };

/** Maps the icon key the backend stores on a category to a component. */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  restaurant: UtensilsCrossed,
  car: Car,
  movie: Film,
  bolt: Zap,
  cart: ShoppingBag,
  bag: ShoppingBag,
};

/**
 * The backend already decided the tone, monotonically, from the stored per-budget threshold.
 * Mapping rather than recomputing is the point: two implementations of "when is a budget amber"
 * is one too many.
 */
const TONE_CLASS: Record<BudgetTone, "good" | "warning" | "critical"> = {
  GOOD: "good",
  WARNING: "warning",
  CRITICAL: "critical",
};

export default async function BudgetsPage() {
  const [budgets, rollup, categories] = await Promise.all([
    getBudgets(),
    getBudgetRollup(),
    getCategories("EXPENSE"),
  ]);

  // Which categories still have no budget — the only ones worth offering in the create dialog.
  const budgeted = new Set(budgets.map((budget) => budget.categoryId));
  const available = categories.filter((category) => !budgeted.has(category.id));

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <CreateBudgetDialog categories={available} />
      </div>

      <SectionCard>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-title-md text-on-surface">Total Monthly Budget</h2>
            <p className="mt-1 text-on-surface-variant">
              <Money value={rollup.spent} className="text-title-lg text-brand" />
              <span className="tnum ml-1 text-data">/ {currency(rollup.limit)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-label-md text-on-surface-variant uppercase">Remaining</p>
            <Money
              value={rollup.remaining}
              className={cn(
                "text-title-lg font-semibold",
                rollup.remaining < 0 ? "text-danger" : "text-success",
              )}
            />
          </div>
        </div>

        <Meter
          value={rollup.usedPercent}
          tone={rollup.usedPercent > 100 ? "critical" : rollup.usedPercent >= 80 ? "warning" : "good"}
          height={12}
          label="Total monthly budget used"
          className="mt-4"
        />
        <div className="tnum mt-2 flex justify-between text-label-md text-on-surface-variant">
          <span>{percent(rollup.usedPercent)} used</span>
          <span>{percent(Math.max(0, 100 - rollup.usedPercent))} available</span>
        </div>
      </SectionCard>

      {budgets.length === 0 ? (
        <SectionCard>
          <p className="text-body-md text-on-surface-variant">
            No budgets yet. Create one and its spend is calculated from your transactions —
            there is no figure to keep up to date by hand.
          </p>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => {
            const Icon = ICONS[budget.icon ?? ""] ?? Wallet;
            const over = budget.remaining < 0;

            return (
              <article key={budget.id} className="fin-card-interactive p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-fixed text-brand-container">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h2 className="truncate text-title-md text-on-surface">
                      {budget.category}
                    </h2>
                  </div>

                  {/*
                    The card's only client island. `available` is passed for prop-shape parity with
                    the create flow; the edit dialog shows the category read-only because the
                    backend's update cannot move a budget between categories.
                  */}
                  <BudgetCardActions budget={budget} categories={available} />
                </div>

                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <Money value={budget.spent} className="font-semibold text-on-surface" />
                  <span className="tnum text-label-md text-on-surface-variant">
                    of {currency(budget.limit)}
                  </span>
                </div>

                <Meter
                  value={budget.usedPercent}
                  tone={TONE_CLASS[budget.tone]}
                  label={`${budget.category} budget used`}
                />

                <p
                  className={cn(
                    "tnum mt-3 text-right text-label-md",
                    over ? "font-semibold text-danger" : "text-on-surface-variant",
                  )}
                >
                  {over
                    ? `${currency(Math.abs(budget.remaining))} over budget`
                    : `${currency(budget.remaining)} remaining`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import {
  Car,
  Home,
  PiggyBank,
  Plane,
  Plus,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { GoalCardActions } from "@/components/goals/goal-card-actions";
import { AddGoalDialog } from "@/components/modals/add-goal-dialog";
import { Meter } from "@/components/shared/meter";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { getCategories, getGoals } from "@/lib/api/queries";
import { currency, percent } from "@/lib/format";

export const metadata: Metadata = { title: "Goals" };

const ICONS: Record<string, LucideIcon> = {
  piggy: PiggyBank,
  plane: Plane,
  home: Home,
  car: Car,
  trophy: Trophy,
  shield: ShieldCheck,
};

/**
 * "Est. Mar 2025", from the date the backend projected.
 *
 * Absent means the backend found too few contributions to establish a rate. Saying so is better
 * than inventing a date on somebody's savings goal — which is exactly what the fixture version did.
 */
function estimate(iso?: string) {
  if (!iso) {
    return "Not enough history to project";
  }
  return `Est. ${new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
}

export default async function GoalsPage() {
  const [goals, categories] = await Promise.all([getGoals(), getCategories("GOAL")]);

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex justify-end">
        <AddGoalDialog
          categories={categories}
          trigger={
            <Button>
              <Plus data-icon="inline-start" />
              Add New Goal
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => {
          const Icon = ICONS[goal.icon ?? ""] ?? PiggyBank;

          return (
            <article key={goal.id} className="fin-card-interactive flex flex-col p-6">
              <div className="mb-6 flex items-start justify-between gap-2">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-fixed text-brand-container">
                  <Icon className="size-6" aria-hidden />
                </span>

                {/*
                  The badge and the menu share the right side. `items-center` on this row rather
                  than inheriting the header's `items-start`, so the badge lines up with the middle
                  of the menu button instead of its top edge.
                */}
                <div className="flex items-center gap-1">
                  {goal.status === "REACHED" ? (
                    <span className="rounded-full bg-success/10 px-2.5 py-1 text-label-md font-semibold text-success">
                      Reached
                    </span>
                  ) : null}
                  <GoalCardActions goal={goal} categories={categories} />
                </div>
              </div>

              <div className="mb-4 flex-1">
                <h2 className="text-title-lg text-brand">{goal.name}</h2>
                <p className="tnum mt-1 text-data text-on-surface-variant">
                  Target: {currency(goal.target)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-end justify-between gap-2">
                  <Money value={goal.saved} className="text-headline-md text-brand" />
                  <span className="tnum text-label-md text-slate-ink">
                    {percent(goal.percent)}
                  </span>
                </div>
                <Meter
                  value={goal.percent}
                  tone={goal.percent >= 75 ? "good" : "brand"}
                  label={`${goal.name} progress`}
                />
                <p className="text-right text-label-md text-on-surface-variant">
                  {estimate(goal.projectedCompletion)}
                </p>
              </div>
            </article>
          );
        })}

        {/* Ghost card, same footprint as a goal card. */}
        <AddGoalDialog
          categories={categories}
          trigger={
            <button
              type="button"
              className="group flex min-h-[248px] cursor-pointer flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed border-border p-6 transition-colors outline-none hover:border-brand hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-surface-high text-on-surface-variant transition-colors group-hover:bg-brand-container group-hover:text-on-brand-container">
                <Plus className="size-7" aria-hidden />
              </span>
              <span className="text-title-lg text-slate-ink transition-colors group-hover:text-brand">
                Add New Goal
              </span>
            </button>
          }
        />
      </div>
    </div>
  );
}

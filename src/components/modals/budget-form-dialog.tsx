"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field, ToggleRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createBudget, updateBudget } from "@/lib/actions/finance";
import type { BudgetPeriod, BudgetStatus, Category } from "@/lib/api/types";

const PERIODS = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * One dialog for creating and editing a budget.
 *
 * <p>Create and edit share every field, every validation rule and the same chrome, so they are one
 * component with a `budget` prop rather than two that drift apart. Passing a `budget` switches the
 * title, the submit label and the action; the form body is otherwise identical.
 *
 * <p><b>Why the trigger is not in here.</b> Create is launched by a button in the page header; edit
 * is launched from a card's dropdown menu. Those cannot share a trigger, so this component is
 * *controlled* — the caller owns `open` — and {@link CreateBudgetDialog} is the thin wrapper that
 * adds the header button.
 *
 * <p><b>Uncontrolled inputs, and why that is safe here.</b> The fields use `defaultValue`, which
 * only applies on mount. Radix unmounts dialog content on close, so each open re-initialises from
 * the current `budget` — but the body is also keyed on the budget id so a remount is guaranteed
 * rather than incidental. Without that, editing one budget and then another would show the first
 * one's numbers.
 */
export function BudgetFormDialog({
  open,
  onOpenChange,
  categories,
  budget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Categories with no budget yet. Only used when creating: the backend enforces one budget per
   * category with a 409, so offering a taken category would invite an error the UI could prevent.
   */
  categories: Category[];
  /** Present means edit. Absent means create. */
  budget?: BudgetStatus;
}) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const editing = budget !== undefined;

  function onSubmit(formData: FormData) {
    const limit = Number(formData.get("limit"));

    if (!Number.isFinite(limit) || limit <= 0) {
      setFieldErrors({ limit: "Enter a limit greater than zero." });
      return;
    }

    const input = {
      categoryId: String(formData.get("categoryId")),
      limit,
      period: String(formData.get("period")) as BudgetPeriod,
      notifyEnabled: formData.get("notifyEnabled") === "on",
      // Preserved on edit rather than reset to 80. The threshold is not editable in this form, so
      // sending a hardcoded default would quietly overwrite a value the user had set elsewhere.
      notifyThresholdPct: budget?.notifyThresholdPct ?? 80,
    };

    /*
     * The two branches are written out rather than picking the action with a ternary.
     *
     * updateBudget resolves to ActionResult<void> (the backend answers 204) while createBudget
     * resolves to ActionResult<BudgetStatus>. A ternary collapses those into a union, and reading
     * `result.data.category` in the success path then fails to typecheck — correctly, because on the
     * update branch there is no data. Splitting the awaits lets each one narrow to its own shape.
     */
    startTransition(async () => {
      if (editing) {
        const result = await updateBudget(budget.id, input);

        if (!result.ok) {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error("Could not update the budget", { description: result.error });
          return;
        }

        settle();
        toast.success("Budget updated", { description: budget.category });
        return;
      }

      const result = await createBudget(input);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not create the budget", { description: result.error });
        return;
      }

      settle();
      toast.success("Budget created", {
        description: `${result.data.category} — spend is calculated from your transactions.`,
      });
    });
  }

  /**
   * Shared success tail: clear errors, close, and re-render.
   *
   * <p>The action already called `revalidatePath`, but this component is showing data the page
   * passed down as a prop, so `refresh()` is what re-runs the Server Component and updates the card.
   */
  function settle() {
    setFieldErrors({});
    onOpenChange(false);
    router.refresh();
  }

  const threshold = budget?.notifyThresholdPct ?? 80;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent
        title={editing ? "Edit Budget" : "Create New Budget"}
        description={
          editing
            ? "Spend is recalculated from your transactions, so changing the limit updates the card immediately."
            : "Spend is computed from your transactions — there is no figure to maintain by hand."
        }
        submitLabel={
          pending
            ? editing
              ? "Saving…"
              : "Creating…"
            : editing
              ? "Save Changes"
              : "Create Budget"
        }
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <div key={budget?.id ?? "create"} className="flex flex-col gap-5">
          {editing ? (
            /*
             * Read-only on edit, deliberately.
             *
             * The backend's update ignores categoryId — a budget cannot be moved to another
             * category, only edited in place. A picker here would appear to work and silently do
             * nothing, which is worse than not offering it. The value still has to reach the
             * server, because the request DTO requires it, hence the hidden input.
             */
            <Field label="Budget Category" htmlFor="budget-category">
              <input type="hidden" name="categoryId" value={budget.categoryId} />
              <p
                id="budget-category"
                className="flex h-10 items-center rounded-lg border border-input bg-surface-low px-3 text-body-md text-on-surface-variant"
              >
                {budget.category}
              </p>
            </Field>
          ) : (
            <Field
              label="Budget Category"
              htmlFor="budget-category"
              error={fieldErrors.categoryId}
            >
              <select
                id="budget-category"
                name="categoryId"
                defaultValue={categories[0]?.id}
                className={SELECT_CLASS}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Limit" htmlFor="budget-limit" error={fieldErrors.limit}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
                $
              </span>
              <Input
                id="budget-limit"
                name="limit"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                defaultValue={budget ? budget.limit : undefined}
                className="tnum pl-7"
                required
              />
            </div>
          </Field>

          <Field label="Period" htmlFor="budget-period">
            <select
              id="budget-period"
              name="period"
              defaultValue={budget?.period ?? "MONTHLY"}
              className={SELECT_CLASS}
            >
              {PERIODS.map((period) => (
                <option key={period} value={period}>
                  {period.charAt(0) + period.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>

          <ToggleRow
            // Reads the budget's own threshold rather than hardcoding 80, so an edit dialog cannot
            // describe a setting the budget does not have.
            title={`Notify me at ${threshold}% of my limit`}
            description="Checked each morning, and shown on the bell."
          >
            <Switch
              name="notifyEnabled"
              defaultChecked={budget ? budget.notifyEnabled : true}
            />
          </ToggleRow>
        </div>
      </FormDialogContent>
    </Dialog>
  );
}

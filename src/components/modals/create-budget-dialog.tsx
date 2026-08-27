"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Field, ToggleRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createBudget } from "@/lib/actions/finance";
import type { Category } from "@/lib/api/types";

const PERIODS = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;

/**
 * `categories` is only the ones that do *not* already have a budget. The backend enforces one
 * budget per category with a 409, so filtering the list means the user cannot pick a duplicate and
 * then be told off for it.
 */
export function CreateBudgetDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  if (categories.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Every category already has a budget", {
            description: "Delete one, or add a new category first.",
          })
        }
      >
        <Plus data-icon="inline-start" />
        Create New Budget
      </Button>
    );
  }

  function onSubmit(formData: FormData) {
    const limit = Number(formData.get("limit"));

    if (!Number.isFinite(limit) || limit <= 0) {
      setFieldErrors({ limit: "Enter a limit greater than zero." });
      return;
    }

    startTransition(async () => {
      const result = await createBudget({
        categoryId: String(formData.get("categoryId")),
        limit,
        period: String(formData.get("period")) as (typeof PERIODS)[number],
        notifyEnabled: formData.get("notifyEnabled") === "on",
        notifyThresholdPct: 80,
      });

      if (result.ok) {
        setFieldErrors({});
        setOpen(false);
        toast.success("Budget created", {
          description: `${result.data.category} — spend is calculated from your transactions.`,
        });
        router.refresh();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not create the budget", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Create New Budget
        </Button>
      </DialogTrigger>

      <FormDialogContent
        title="Create New Budget"
        description="Spend is computed from your transactions — there is no figure to maintain by hand."
        submitLabel={pending ? "Creating…" : "Create Budget"}
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <Field
          label="Budget Category"
          htmlFor="budget-category"
          error={fieldErrors.categoryId}
        >
          <select
            id="budget-category"
            name="categoryId"
            defaultValue={categories[0]?.id}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

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
              className="tnum pl-7"
              required
            />
          </div>
        </Field>

        <Field label="Period" htmlFor="budget-period">
          <select
            id="budget-period"
            name="period"
            defaultValue="MONTHLY"
            className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {PERIODS.map((period) => (
              <option key={period} value={period}>
                {period.charAt(0) + period.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>

        <ToggleRow
          title="Notify me at 80% of my limit"
          description="Checked each morning, and shown on the bell."
        >
          <Switch name="notifyEnabled" defaultChecked />
        </ToggleRow>
      </FormDialogContent>
    </Dialog>
  );
}

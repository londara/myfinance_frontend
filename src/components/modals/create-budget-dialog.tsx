"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { BudgetFormDialog } from "@/components/modals/budget-form-dialog";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/api/types";

/**
 * The page header's "Create New Budget" button and its dialog.
 *
 * <p>Thin on purpose: the form itself lives in {@link BudgetFormDialog}, which the edit flow on each
 * budget card reuses. This component exists only to own the trigger and the open state, because
 * create is launched from the header while edit is launched from a card's dropdown.
 *
 * <p>`categories` is only the ones that do *not* already have a budget. The backend enforces one
 * budget per category with a 409, so filtering the list means the user cannot pick a duplicate and
 * then be told off for it.
 */
export function CreateBudgetDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Create New Budget
      </Button>

      <BudgetFormDialog open={open} onOpenChange={setOpen} categories={categories} />
    </>
  );
}

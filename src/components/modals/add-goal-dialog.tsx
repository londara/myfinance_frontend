"use client";

import { useState, type ReactNode } from "react";
import { Slot } from "radix-ui";

import { GoalFormDialog } from "@/components/modals/goal-form-dialog";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/api/types";

/**
 * The "Add New Goal" trigger and its dialog.
 *
 * <p>Thin on purpose: the form lives in {@link GoalFormDialog}, which the edit flow on each goal
 * card reuses. This component exists only to own a trigger and the open state.
 *
 * <p>The page passes two different triggers — the header button and the dashed ghost card — so the
 * supplied node is wrapped in a `Slot` to receive the click handler rather than being re-created
 * here. That keeps the ghost card's markup where it is read: next to the cards it stands in for.
 */
export function AddGoalDialog({
  categories,
  trigger,
}: {
  categories: Category[];
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <Slot.Root onClick={() => setOpen(true)}>{trigger}</Slot.Root>
      ) : (
        <Button onClick={() => setOpen(true)}>Add New Goal</Button>
      )}

      <GoalFormDialog open={open} onOpenChange={setOpen} categories={categories} />
    </>
  );
}

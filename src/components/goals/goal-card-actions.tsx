"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { GoalFormDialog } from "@/components/modals/goal-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteGoal } from "@/lib/actions/finance";
import type { Category, Goal } from "@/lib/api/types";

/**
 * Edit / Delete for one goal card.
 *
 * <p>A client island inside a Server Component page: the card markup stays on the server and only
 * this menu ships JavaScript. Mirrors `BudgetCardActions`, including the arrangement that matters —
 * the dialog is a **sibling** of the menu, never a child of `DropdownMenuContent`. Nested, selecting
 * the item closes the menu, which unmounts the content and the dialog with it, and nothing opens.
 */
export function GoalCardActions({
  goal,
  categories,
}: {
  goal: Goal;
  categories: Category[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteGoal(goal.id);

      if (result.ok) {
        toast.success("Goal deleted", {
          // Says what is lost, because a goal's contributions go with it and that is not obvious.
          description: `${goal.name} — its recorded contributions are removed too.`,
        });
        router.refresh();
      } else {
        toast.error("Could not delete the goal", { description: result.error });
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for the ${goal.name} goal`}
            disabled={pending}
            className="shrink-0 text-on-surface-variant"
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GoalFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        goal={goal}
      />
    </>
  );
}

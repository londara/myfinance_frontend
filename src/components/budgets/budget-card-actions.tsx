"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BudgetFormDialog } from "@/components/modals/budget-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBudget } from "@/lib/actions/finance";
import type { BudgetStatus, Category } from "@/lib/api/types";

/**
 * Edit / Delete for one budget card.
 *
 * <p>A client island inside a Server Component page: the card markup itself stays on the server, and
 * only this menu ships JavaScript.
 *
 * <p><b>The dialog is a sibling of the menu, not a child of it.</b> Nesting a `Dialog` inside
 * `DropdownMenuContent` is the classic Radix trap — selecting the item closes the menu, which
 * unmounts the content, which unmounts the dialog before it can open, so nothing happens. Keeping
 * them as siblings with the dialog driven by state means the menu closing is unrelated to the dialog
 * opening.
 */
export function BudgetCardActions({
  budget,
  categories,
}: {
  budget: BudgetStatus;
  /** Forwarded only so the shared dialog keeps one prop shape; edit does not use the list. */
  categories: Category[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteBudget(budget.id);

      if (result.ok) {
        toast.success("Budget deleted", {
          description: `${budget.category} — the transactions themselves are untouched.`,
        });
        router.refresh();
      } else {
        toast.error("Could not delete the budget", { description: result.error });
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
            aria-label={`Actions for the ${budget.category} budget`}
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

      <BudgetFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        budget={budget}
      />
    </>
  );
}

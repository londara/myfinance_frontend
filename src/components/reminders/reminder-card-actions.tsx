"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ReminderFormDialog } from "@/components/modals/reminder-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteReminder } from "@/lib/actions/finance";
import type { Account, Category, ReminderRule } from "@/lib/api/types";

/**
 * Edit / Delete for one reminder.
 *
 * <p><b>These act on the whole rule, not the single date the row shows.</b> That matters enough to
 * say in the menu itself: the row reads "Rent · Sep 28", but there is no such thing as editing one
 * occurrence — the amount and schedule live on the rule, and the API offers no per-date delete. So
 * the items are labelled "Edit reminder" and "Delete reminder", with a heading naming the rule, and
 * the delete toast spells out that every scheduled date goes with it. Labelling these "Edit" and
 * "Delete" alone would invite someone to remove a year of rent to skip one month.
 *
 * <p>The dialog is a sibling of the menu rather than a child of `DropdownMenuContent` — nested, the
 * menu closing unmounts the dialog before it can open. Same as the budget and goal cards.
 */
export function ReminderCardActions({
  reminder,
  accounts,
  categories,
}: {
  /** The parent rule of the occurrence being displayed. */
  reminder: ReminderRule;
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteReminder(reminder.id);

      if (result.ok) {
        toast.success("Reminder deleted", {
          description: `${reminder.name} — every scheduled date was removed. Payments already recorded are kept.`,
        });
        router.refresh();
      } else {
        toast.error("Could not delete the reminder", { description: result.error });
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
            aria-label={`Actions for the ${reminder.name} reminder`}
            disabled={pending}
            className="shrink-0 text-on-surface-variant"
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>

        {/*
          w-auto overrides the shipped default of `w-(--radix-dropdown-menu-trigger-width)`, which
          sizes the menu to its trigger — a 32px icon button, with a 128px floor. That is wide enough
          for the Budgets and Goals menus ("Edit", "Delete") but wrapped these longer labels onto two
          lines each. min-w-48 keeps a sensible floor now that the width follows the content.
        */}
        <DropdownMenuContent align="end" className="w-auto min-w-48">
          <DropdownMenuLabel className="text-label-md text-on-surface-variant">
            {reminder.name} · all dates
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit reminder
          </DropdownMenuItem>

          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 />
            Delete reminder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReminderFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        accounts={accounts}
        categories={categories}
        reminder={reminder}
      />
    </>
  );
}

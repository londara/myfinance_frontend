"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { ReminderFormDialog } from "@/components/modals/reminder-form-dialog";
import { Button } from "@/components/ui/button";
import type { Account, Category } from "@/lib/api/types";

/**
 * The page header's "Create New Reminder" button and its dialog.
 *
 * <p>Thin on purpose: the form lives in {@link ReminderFormDialog}, which the edit flow on each
 * occurrence row reuses. This component exists only to own the trigger and the open state.
 */
export function CreateReminderDialog({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Create New Reminder
      </Button>

      <ReminderFormDialog
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}

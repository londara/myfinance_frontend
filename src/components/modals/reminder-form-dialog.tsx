"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Field, FieldRow, ToggleRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createReminder, updateReminder } from "@/lib/actions/finance";
import type { Account, Category, ReminderFrequency, ReminderRule } from "@/lib/api/types";

const FREQUENCIES = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * One dialog for creating and editing a reminder rule.
 *
 * <p>Same arrangement as `BudgetFormDialog` and `GoalFormDialog`: create and edit share every field
 * and every rule, so they are one component with a `reminder` prop rather than two that drift apart.
 * *Controlled*, because create is launched from the page header while edit comes from a row's
 * dropdown — {@link CreateReminderDialog} is the wrapper that owns the header trigger.
 *
 * <p>The fields are uncontrolled and read from `FormData` at submit; the body is keyed on the rule
 * id so each open re-initialises from `defaultValue` rather than showing the previous rule.
 */
export function ReminderFormDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  reminder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  categories: Category[];
  /** Present means edit. Absent means create. */
  reminder?: ReminderRule;
}) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const editing = reminder !== undefined;

  function settle() {
    setFieldErrors({});
    onOpenChange(false);
    router.refresh();
  }

  function onSubmit(formData: FormData) {
    const amount = Number(formData.get("amount"));

    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldErrors({ amount: "Enter an amount greater than zero." });
      return;
    }

    const accountId = String(formData.get("accountId") ?? "");
    const categoryId = String(formData.get("categoryId") ?? "");

    const input = {
      name: String(formData.get("name")).trim(),
      amount,
      frequency: String(formData.get("frequency")) as ReminderFrequency,
      firstDueOn: String(formData.get("firstDueOn")),
      // Nominating an account here is what makes Pay Now work later without asking again.
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
      autopayEnabled: formData.get("autopayEnabled") === "on",
      notifyEnabled: formData.get("notifyEnabled") === "on",
      // Preserved on edit rather than reset to 3: the lead time is not editable in this form, so
      // sending a hardcoded default would quietly overwrite a value set elsewhere.
      notifyDaysBefore: reminder?.notifyDaysBefore ?? 3,
    };

    // Split branches rather than a ternary over the two actions — they resolve to the same payload
    // type here, but keeping the shape identical to the budget and goal dialogs keeps them readable
    // side by side.
    startTransition(async () => {
      if (editing) {
        const result = await updateReminder(reminder.id, input);

        if (!result.ok) {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error("Could not update the reminder", { description: result.error });
          return;
        }

        settle();
        toast.success("Reminder updated", {
          // Said out loud because it is a bigger change than it looks: the backend rebuilds every
          // future unpaid date from the new schedule.
          description: "Upcoming due dates were rebuilt. Paid ones were left as they are.",
        });
        return;
      }

      const result = await createReminder(input);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not create the reminder", { description: result.error });
        return;
      }

      settle();
      toast.success("Reminder created", {
        // The backend materialises a rolling 12 months of due dates on create, which is why the
        // calendar fills in immediately rather than only showing the first one.
        description: "Twelve months of due dates were added to your calendar.",
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent
        title={editing ? "Edit Reminder" : "Create New Reminder"}
        description={
          editing
            ? "Changing the amount or schedule rebuilds every upcoming due date. Dates you have already paid are kept."
            : undefined
        }
        submitLabel={
          pending
            ? editing
              ? "Saving…"
              : "Creating…"
            : editing
              ? "Save Changes"
              : "Create Reminder"
        }
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <div key={reminder?.id ?? "create"} className="flex flex-col gap-5">
          <Field label="Reminder Name" htmlFor="reminder-name" error={fieldErrors.name}>
            <Input
              id="reminder-name"
              name="name"
              placeholder="e.g. Rent, Electricity Bill"
              defaultValue={reminder?.name}
              maxLength={120}
              required
            />
          </Field>

          <FieldRow>
            <Field label="Amount" htmlFor="reminder-amount" error={fieldErrors.amount}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
                  $
                </span>
                <Input
                  id="reminder-amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={reminder ? reminder.amount : undefined}
                  className="tnum pl-7"
                  required
                />
              </div>
            </Field>

            <Field
              label="First Due Date"
              htmlFor="reminder-date"
              error={fieldErrors.firstDueOn}
            >
              <Input
                id="reminder-date"
                name="firstDueOn"
                type="date"
                defaultValue={reminder?.firstDueOn ?? todayIso()}
                required
              />
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Frequency" htmlFor="reminder-frequency">
              <select
                id="reminder-frequency"
                name="frequency"
                defaultValue={reminder?.frequency ?? "MONTHLY"}
                className={SELECT_CLASS}
              >
                {FREQUENCIES.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Category" htmlFor="reminder-category">
              <select
                id="reminder-category"
                name="categoryId"
                defaultValue={reminder?.categoryId ?? ""}
                className={SELECT_CLASS}
              >
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          </FieldRow>

          <Field
            label="Pay From"
            htmlFor="reminder-account"
            hint="Needed for Pay Now to record the payment without asking again."
          >
            <select
              id="reminder-account"
              name="accountId"
              defaultValue={reminder?.accountId ?? accounts[0]?.id ?? ""}
              className={SELECT_CLASS}
            >
              <option value="">Decide later</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.methodLabel}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex flex-col gap-4 border-t border-border pt-5">
            <ToggleRow title="Set auto-pay" description="Mark new occurrences as scheduled.">
              <Switch
                name="autopayEnabled"
                defaultChecked={reminder ? reminder.autopayEnabled : false}
              />
            </ToggleRow>

            <ToggleRow
              title="Send notification"
              description={`Get a reminder ${reminder?.notifyDaysBefore ?? 3} days before it is due.`}
            >
              <Switch
                name="notifyEnabled"
                defaultChecked={reminder ? reminder.notifyEnabled : true}
              />
            </ToggleRow>
          </div>
        </div>
      </FormDialogContent>
    </Dialog>
  );
}

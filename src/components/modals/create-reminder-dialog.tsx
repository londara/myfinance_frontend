"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Field, FieldRow, ToggleRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createReminder } from "@/lib/actions/finance";
import type { Account, Category } from "@/lib/api/types";

const FREQUENCIES = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;

function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function CreateReminderDialog({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const amount = Number(formData.get("amount"));

    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldErrors({ amount: "Enter an amount greater than zero." });
      return;
    }

    startTransition(async () => {
      const accountId = String(formData.get("accountId") ?? "");
      const categoryId = String(formData.get("categoryId") ?? "");

      const result = await createReminder({
        name: String(formData.get("name")).trim(),
        amount,
        frequency: String(formData.get("frequency")) as (typeof FREQUENCIES)[number]["value"],
        firstDueOn: String(formData.get("firstDueOn")),
        // Nominating an account here is what makes Pay Now work later without asking again.
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        autopayEnabled: formData.get("autopayEnabled") === "on",
        notifyEnabled: formData.get("notifyEnabled") === "on",
        notifyDaysBefore: 3,
      });

      if (result.ok) {
        setFieldErrors({});
        setOpen(false);
        toast.success("Reminder created", {
          // The backend materialises a rolling 12 months of due dates on create, which is why the
          // calendar fills in immediately rather than only showing the first one.
          description: "Twelve months of due dates were added to your calendar.",
        });
        router.refresh();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not create the reminder", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Create New Reminder
        </Button>
      </DialogTrigger>

      <FormDialogContent
        title="Create New Reminder"
        submitLabel={pending ? "Creating…" : "Create Reminder"}
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <Field label="Reminder Name" htmlFor="reminder-name" error={fieldErrors.name}>
          <Input
            id="reminder-name"
            name="name"
            placeholder="e.g. Rent, Electricity Bill"
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
              defaultValue={todayIso()}
              required
            />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Frequency" htmlFor="reminder-frequency">
            <select
              id="reminder-frequency"
              name="frequency"
              defaultValue="MONTHLY"
              className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
              defaultValue=""
              className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            defaultValue={accounts[0]?.id ?? ""}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            <Switch name="autopayEnabled" />
          </ToggleRow>

          <ToggleRow
            title="Send notification"
            description="Get a reminder three days before it is due."
          >
            <Switch name="notifyEnabled" defaultChecked />
          </ToggleRow>
        </div>
      </FormDialogContent>
    </Dialog>
  );
}

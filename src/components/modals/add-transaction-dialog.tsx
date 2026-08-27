"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Field, FieldRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction } from "@/lib/actions/finance";
import type { Account, Category } from "@/lib/api/types";

/** Today, as the yyyy-mm-dd a date input and the backend both expect. */
function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function AddTransactionDialog({
  accounts,
  categories,
  trigger,
}: {
  accounts: Account[];
  categories: Category[];
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  /*
   * The category list is filtered by the tab, because the backend keeps one categories table with a
   * `kind` discriminator. Offering "Groceries" for an income row would let a user file a salary
   * under an expense category and quietly corrupt every aggregate that groups by category.
   */
  const relevant = categories.filter((category) =>
    kind === "expense" ? category.kind !== "INCOME" : category.kind === "INCOME",
  );

  // Nothing to post a transaction against until an account exists.
  if (accounts.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() =>
          toast.info("Link an account first", {
            description: "A transaction has to be paid from somewhere. Add one in Settings.",
          })
        }
      >
        <Plus data-icon="inline-start" />
        <span className="hidden sm:inline">Add Transaction</span>
      </Button>
    );
  }

  function onSubmit(formData: FormData) {
    const amount = Number(formData.get("amount"));

    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldErrors({ amount: "Enter an amount greater than zero." });
      return;
    }

    startTransition(async () => {
      const categoryId = String(formData.get("categoryId") ?? "");

      const result = await createTransaction({
        date: String(formData.get("date")),
        description: String(formData.get("description")).trim(),
        amount,
        // The API takes a positive amount plus this flag and applies the sign server-side, so the
        // stored ledger only ever holds signed values.
        expense: kind === "expense",
        accountId: String(formData.get("accountId")),
        categoryId: categoryId || undefined,
        notes: String(formData.get("notes") ?? "") || undefined,
      });

      if (result.ok) {
        setFieldErrors({});
        setOpen(false);
        toast.success(kind === "expense" ? "Expense recorded" : "Income recorded", {
          description: result.data.description,
        });
        router.refresh();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not save", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus data-icon="inline-start" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sr-only sm:hidden">Add Transaction</span>
          </Button>
        )}
      </DialogTrigger>

      <FormDialogContent
        title="Add Transaction"
        submitLabel={pending ? "Saving…" : "Save Transaction"}
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <Tabs value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
          <TabsList className="h-10 w-full">
            <TabsTrigger value="expense" className="flex-1">
              Expense
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1">
              Income
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Field label="Amount" htmlFor="tx-amount" error={fieldErrors.amount}>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
              $
            </span>
            <Input
              id="tx-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="tnum pl-7"
              required
            />
          </div>
        </Field>

        <Field
          label="Description"
          htmlFor="tx-desc"
          error={fieldErrors.description}
        >
          <Input
            id="tx-desc"
            name="description"
            placeholder="e.g. Grocery Shopping"
            maxLength={200}
            required
          />
        </Field>

        <FieldRow>
          <Field label="Category" htmlFor="tx-category">
            <select
              id="tx-category"
              name="categoryId"
              defaultValue=""
              className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Uncategorised</option>
              {relevant.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date" htmlFor="tx-date" error={fieldErrors.date}>
            <Input
              id="tx-date"
              name="date"
              type="date"
              defaultValue={todayIso()}
              required
            />
          </Field>
        </FieldRow>

        <Field label="Paid From" htmlFor="tx-account" error={fieldErrors.accountId}>
          <select
            id="tx-account"
            name="accountId"
            defaultValue={accounts[0]?.id}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.methodLabel}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notes" htmlFor="tx-notes">
          <Textarea
            id="tx-notes"
            name="notes"
            rows={3}
            maxLength={1000}
            placeholder="Add additional details…"
            className="resize-none"
          />
        </Field>
      </FormDialogContent>
    </Dialog>
  );
}

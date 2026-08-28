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
import type { Account, Category, Goal } from "@/lib/api/types";
import { currency } from "@/lib/format";

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
  goals,
  trigger,
}: {
  accounts: Account[];
  categories: Category[];
  /** Goals an expense may contribute to. Empty hides the field entirely. */
  goals: Goal[];
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  /*
   * The account and amount are tracked here, unlike every other field in this dialog.
   *
   * The rest stay uncontrolled and are read from FormData at submit, which is less code. These two
   * cannot: the overspend warning has to appear while the user types, which means their values must
   * be known before submit. FormData is still what the submit handler reads, so there is one source
   * of truth for what gets sent.
   */
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [amountText, setAmountText] = useState("");
  const [goalId, setGoalId] = useState("");

  const account = accounts.find((candidate) => candidate.id === accountId) ?? accounts[0];

  /*
   * A credit card is a debt, so its balance is meant to go negative — the seeded Amex starts below
   * zero. Constraining it would make the card unchargeable the moment it carried any balance. The
   * right ceiling for one is a credit limit, which this schema has no column for.
   */
  const onCredit = account?.kind === "CREDIT_CARD";
  const available = account?.balance ?? 0;
  const typedAmount = Number(amountText);

  const overspends =
    kind === "expense" &&
    account !== undefined &&
    !onCredit &&
    Number.isFinite(typedAmount) &&
    typedAmount > available;

  const selectedGoal = goals.find((goal) => goal.id === goalId);

  const overspendMessage = overspends
    ? `${currency(typedAmount)} is more than ${account.name} holds (${currency(available)}).`
    : undefined;

  /** Clears the two tracked fields so a reopened dialog does not show the last attempt. */
  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setAmountText("");
      setAccountId(accounts[0]?.id ?? "");
      setGoalId("");
      setFieldErrors({});
    }
  }

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

    /*
     * Re-checked at submit, not only in the derived state above.
     *
     * The submit button is disabled while `overspends` holds, but a disabled button is a UI
     * affordance rather than a guarantee: a form can still be submitted by Enter in some browsers,
     * and by anything scripted. The backend rejects it regardless — this branch exists so the user
     * gets the message on the field instead of a toast.
     */
    if (overspends && overspendMessage) {
      setFieldErrors({ amount: overspendMessage });
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
        // Only ever sent for an expense: the backend rejects a goal on income, because income is
        // money arriving rather than money set aside.
        goalId: kind === "expense" && goalId ? goalId : undefined,
      });

      if (result.ok) {
        setFieldErrors({});
        setOpen(false);
        const fundedGoal = goals.find((goal) => goal.id === goalId);
        toast.success(kind === "expense" ? "Expense recorded" : "Income recorded", {
          description:
            kind === "expense" && fundedGoal
              ? `${result.data.description} — contributed to ${fundedGoal.name}`
              : result.data.description,
        });
        router.refresh();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not save", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        submitDisabled={pending || overspends}
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

        <Field
          label="Amount"
          htmlFor="tx-amount"
          error={fieldErrors.amount ?? overspendMessage}
        >
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
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              aria-invalid={overspends || undefined}
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
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            required
          >
            {accounts.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} · {option.methodLabel}
              </option>
            ))}
          </select>

          {/*
            States the balance the expense is measured against. Without it the limit is invisible
            until it is hit, which reads as the form breaking rather than as a rule.
          */}
          {account && kind === "expense" ? (
            <p className="mt-1.5 text-label-md text-on-surface-variant">
              {onCredit
                ? "Credit card — charges are not limited by the balance."
                : `Available: ${currency(available)}`}
            </p>
          ) : null}
        </Field>

        {/*
          Expense only, and hidden when there are no goals.

          This is what makes a goal fundable at all: a goal's progress is the sum of its
          contributions, so without a way to record one, every goal sits at 0% forever. Attaching it
          to the expense that paid for it — rather than a separate "add contribution" form — means
          the money is only ever counted once, in the ledger, and the goal reads its progress from
          there instead of holding a second copy of the truth.
        */}
        {kind === "expense" && goals.length > 0 ? (
          <Field label="Contribute to Goal (Optional)" htmlFor="tx-goal">
            <select
              id="tx-goal"
              value={goalId}
              onChange={(event) => setGoalId(event.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">None</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name} — {currency(goal.saved)} of {currency(goal.target)}
                </option>
              ))}
            </select>

            {selectedGoal ? (
              <p className="mt-1.5 text-label-md text-on-surface-variant">
                {`Adds to ${selectedGoal.name}: ${currency(selectedGoal.saved)} → ${currency(
                  selectedGoal.saved + (Number.isFinite(typedAmount) ? Math.max(typedAmount, 0) : 0),
                )} of ${currency(selectedGoal.target)}`}
              </p>
            ) : null}
          </Field>
        ) : null}

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

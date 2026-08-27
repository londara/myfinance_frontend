"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Field, FieldRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Money } from "@/components/shared/money";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createAccount, removeAccount } from "@/lib/actions/finance";
import type { Account, AccountKind } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const KINDS: { value: AccountKind; label: string }[] = [
  { value: "CHECKING", label: "Checking" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "CASH", label: "Cash" },
];

/**
 * settings → Linked Accounts.
 *
 * <p>This list and the Payment Method dropdown in Add Transaction are the same table — SCHEMA.md
 * settled that "Amex Credit Card" and "Credit Card (•••• 4242)" are one object seen twice. So an
 * account added here appears in that dropdown immediately.
 */
export function LinkedAccounts({ accounts }: { accounts: Account[] }) {
  const router = useRouter();

  return (
    <SectionCard>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title-lg text-brand">Linked Accounts</h2>
        <AddAccountDialog onDone={() => router.refresh()} />
      </div>

      {accounts.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">
          No accounts yet. Add one — a transaction has to be paid from somewhere.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              onDone={() => router.refresh()}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function AccountRow({
  account,
  onDone,
}: {
  account: Account;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function onRemove() {
    startTransition(async () => {
      const result = await removeAccount(account.id);

      if (result.ok) {
        // "Deactivated", not "deleted": the backend keeps the row because transactions reference
        // it, and unlinking a card must not erase the history paid with it.
        toast.success(`${account.name} unlinked`, {
          description: "Its past transactions keep their labels.",
        });
        onDone();
      } else {
        toast.error("Could not unlink", { description: result.error });
      }
    });
  }

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors",
        account.active ? "hover:border-brand-container" : "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-high text-brand">
          <Landmark className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-title-md text-brand">
            {account.name}
            {!account.active ? (
              <span className="ml-2 text-label-md font-normal text-on-surface-variant">
                unlinked
              </span>
            ) : null}
          </p>
          <p className="text-body-md text-on-surface-variant">
            {account.institution ? `${account.institution} · ` : ""}
            {account.methodLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Money value={account.balance} className="text-title-md text-on-surface" />
        {account.active ? (
          <Button variant="destructive" onClick={onRemove} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Unlink
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function AddAccountDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const openingBalance = Number(formData.get("openingBalance") ?? 0);

    if (!Number.isFinite(openingBalance)) {
      setFieldErrors({ openingBalance: "Enter a number." });
      return;
    }

    startTransition(async () => {
      const result = await createAccount({
        name: String(formData.get("name")).trim(),
        kind: String(formData.get("kind")) as AccountKind,
        institution: String(formData.get("institution") ?? "") || undefined,
        mask: String(formData.get("mask") ?? "") || undefined,
        currency: "USD",
        openingBalance,
      });

      if (result.ok) {
        setFieldErrors({});
        setOpen(false);
        toast.success("Account linked", {
          description: "It is now available as a payment method.",
        });
        onDone();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not link the account", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus data-icon="inline-start" />
          Add Account
        </Button>
      </DialogTrigger>

      <FormDialogContent
        title="Add Account"
        description="This becomes a payment method in Add Transaction."
        submitLabel={pending ? "Linking…" : "Link Account"}
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <Field label="Account Name" htmlFor="account-name" error={fieldErrors.name}>
          <Input
            id="account-name"
            name="name"
            placeholder="e.g. Chase Checking"
            maxLength={120}
            required
          />
        </Field>

        <FieldRow>
          <Field label="Type" htmlFor="account-kind">
            <select
              id="account-kind"
              name="kind"
              defaultValue="CHECKING"
              className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Last 4 Digits"
            htmlFor="account-mask"
            hint="Optional. Never the full number."
          >
            <Input
              id="account-mask"
              name="mask"
              inputMode="numeric"
              maxLength={4}
              placeholder="4242"
              className="tnum"
            />
          </Field>
        </FieldRow>

        <Field label="Institution" htmlFor="account-institution">
          <Input
            id="account-institution"
            name="institution"
            placeholder="e.g. Chase"
            maxLength={120}
          />
        </Field>

        <Field
          label="Current Balance"
          htmlFor="account-balance"
          error={fieldErrors.openingBalance}
          hint="Negative for a credit card you owe on."
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
              $
            </span>
            <Input
              id="account-balance"
              name="openingBalance"
              type="number"
              step="0.01"
              defaultValue="0"
              className="tnum pl-7"
              required
            />
          </div>
        </Field>
      </FormDialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ReminderCardActions } from "@/components/reminders/reminder-card-actions";
import { Money } from "@/components/shared/money";
import { StatusChip, statusTone } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { payOccurrence } from "@/lib/actions/finance";
import type {
  Account,
  Category,
  GroupedOccurrences,
  ReminderOccurrence,
  ReminderRule,
} from "@/lib/api/types";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Due Tomorrow / Next Week / Later This Month.
 *
 * <p>The grouping is done by the backend against today's date, not stored — "Due Tomorrow" stops
 * being true tomorrow. This component just renders whichever buckets came back non-empty.
 */
export function ReminderGroups({
  grouped,
  rules,
  accounts,
  categories,
}: {
  grouped: GroupedOccurrences;
  /**
   * The rules behind the occurrences, for the row menus.
   *
   * An occurrence only carries `reminderId` and `name`, so the edit dialog cannot be populated
   * from a row alone — the amount, schedule and account all live on the rule.
   */
  rules: ReminderRule[];
  accounts: Account[];
  categories: Category[];
}) {
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const groups = [
    { title: "Due Tomorrow", tone: "critical" as const, items: grouped.dueTomorrow },
    { title: "Next Week", tone: "neutral" as const, items: grouped.nextWeek },
    { title: "Later This Month", tone: "neutral" as const, items: grouped.laterThisMonth },
  ].filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    return (
      <section className="fin-card p-5">
        <p className="text-body-md text-on-surface-variant">
          Nothing else due this month.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-gutter">
      {groups.map((group) => (
        <section
          key={group.title}
          className={cn(
            "fin-card p-5",
            group.tone === "critical" && "border-l-4 border-l-danger",
          )}
        >
          <h2
            className={cn(
              "mb-4 text-label-md font-bold uppercase",
              group.tone === "critical" ? "text-danger" : "text-slate-ink",
            )}
          >
            {group.title}
          </h2>

          <ul className="flex flex-col divide-y divide-border">
            {group.items.map((occurrence) => (
              <OccurrenceRow
                key={occurrence.id}
                occurrence={occurrence}
                urgent={group.tone === "critical"}
                rule={rulesById.get(occurrence.reminderId)}
                accounts={accounts}
                categories={categories}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function OccurrenceRow({
  occurrence,
  urgent,
  rule,
  accounts,
  categories,
}: {
  occurrence: ReminderOccurrence;
  urgent: boolean;
  /** Absent only if the rule vanished between the two reads; the menu is then hidden. */
  rule?: ReminderRule;
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paid, setPaid] = useState(occurrence.status === "PAID");

  function onPay() {
    startTransition(async () => {
      // The backend nominates the paying account from the reminder rule, so no accountId is sent.
      // It answers 400 if the rule has none, and that message is surfaced as-is.
      const result = await payOccurrence(occurrence.id);

      if (result.ok) {
        setPaid(true);
        toast.success(`${occurrence.name} paid`, {
          description: "A transaction was recorded and your balance updated.",
        });
        // The action revalidated the routes; refresh re-runs this page's Server Component so the
        // calendar dot and the dashboard tiles move together.
        router.refresh();
      } else {
        toast.error("Could not pay this bill", { description: result.error });
      }
    });
  }

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-title-md text-brand">{occurrence.name}</span>

        <div className="flex shrink-0 items-center gap-1">
          <Money value={occurrence.amount} className="font-semibold text-on-surface" />
          {rule ? (
            <ReminderCardActions
              reminder={rule}
              accounts={accounts}
              categories={categories}
            />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-body-md text-on-surface-variant">
          {longDate(occurrence.dueOn)}
        </span>
        <StatusChip
          label={paid ? "PAID" : occurrence.status}
          tone={statusTone(paid ? "PAID" : occurrence.status)}
        />
      </div>

      {urgent && !paid ? (
        <Button className="mt-2 w-full" onClick={onPay} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Paying…
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      ) : null}
    </li>
  );
}

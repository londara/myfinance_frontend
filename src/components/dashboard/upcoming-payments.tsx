import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { Money } from "@/components/shared/money";
import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import { StatusChip, statusTone } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import type { ReminderOccurrence } from "@/lib/api/types";
import { longDate, relativeDueLabel } from "@/lib/format";

export function UpcomingPayments({ payments }: { payments: ReminderOccurrence[] }) {
  return (
    <SectionCard className="flex flex-col">
      <SectionHeader
        title="Upcoming Payments"
        action={
          <Button variant="link" size="sm" asChild>
            <Link href="/reminders">View All</Link>
          </Button>
        }
      />

      {payments.length === 0 ? (
        <p className="mt-6 text-body-md text-on-surface-variant">
          Nothing due. Add a reminder to track a recurring bill.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex items-center justify-between gap-4 rounded-lg bg-surface-low p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-fixed text-brand-container">
                  <CalendarClock className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-title-md text-on-surface">{payment.name}</p>
                  <p className="text-body-md text-on-surface-variant">
                    {relativeDueLabel(payment.dueOn) ?? longDate(payment.dueOn)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusChip label={payment.status} tone={statusTone(payment.status)} />
                <Money value={payment.amount} className="font-semibold text-on-surface" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

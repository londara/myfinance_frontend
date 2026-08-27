"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OccurrenceStatus, ReminderOccurrence } from "@/lib/api/types";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DOT: Record<OccurrenceStatus, string> = {
  UNPAID: "bg-danger",
  SCHEDULED: "bg-brand-container",
  PAID: "bg-success",
};

type Cell = { day: number; inMonth: boolean; items: ReminderOccurrence[] };

/**
 * Builds the 7-column grid: leading days from the previous month, the real days with their
 * occurrences attached, then trailing days to complete the last week.
 */
function buildGrid(
  year: number,
  month: number,
  occurrences: ReminderOccurrence[],
): Cell[] {
  const monthIndex = month - 1;
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrev = new Date(year, monthIndex, 0).getDate();

  // Group by day-of-month once, instead of filtering the array inside the render loop.
  const byDay = new Map<number, ReminderOccurrence[]>();
  for (const occurrence of occurrences) {
    const day = Number(occurrence.dueOn.slice(8, 10));
    byDay.set(day, [...(byDay.get(day) ?? []), occurrence]);
  }

  const cells: Cell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ day: daysInPrev - i, inMonth: false, items: [] });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, inMonth: true, items: byDay.get(day) ?? [] });
  }

  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing, inMonth: false, items: [] });
    trailing += 1;
  }

  return cells;
}

export function ReminderCalendar({
  year,
  month,
  occurrences,
}: {
  year: number;
  month: number;
  occurrences: ReminderOccurrence[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const cells = buildGrid(year, month, occurrences);

  const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  /** Month navigation writes to the URL, so the server fetches the new month. */
  function go(delta: number) {
    const date = new Date(year, month - 1 + delta, 1);
    const next = new URLSearchParams({
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1),
    });
    startTransition(() => router.push(`/reminders?${next}`, { scroll: false }));
  }

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  return (
    <SectionCard className="flex flex-col" aria-busy={pending}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-title-lg text-brand">{label}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            disabled={pending}
            onClick={() => go(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            disabled={pending}
            onClick={() => go(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="pb-1 text-center text-label-md text-on-surface-variant uppercase"
          >
            {weekday}
          </div>
        ))}

        {cells.map((cell, index) => {
          if (!cell.inMonth) {
            return (
              <div
                key={`pad-${index}`}
                aria-hidden
                className="tnum flex min-h-14 items-start justify-center p-2 text-body-md text-outline/50"
              >
                {cell.day}
              </div>
            );
          }

          const isToday = isCurrentMonth && today.getDate() === cell.day;

          const cellNode = (
            <div
              className={cn(
                "tnum relative flex min-h-14 items-start justify-center rounded-lg border bg-card p-2 text-body-md text-on-surface",
                isToday ? "border-brand-container ring-1 ring-brand-container" : "border-border",
                cell.items.length > 0 && "font-semibold",
              )}
            >
              {cell.day}
              {cell.items.length > 0 ? (
                <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
                  {cell.items.map((item) => (
                    <span
                      key={item.id}
                      className={cn("size-1.5 rounded-full", DOT[item.status])}
                    />
                  ))}
                </span>
              ) : null}
            </div>
          );

          if (cell.items.length === 0) {
            return <div key={cell.day}>{cellNode}</div>;
          }

          return (
            <Tooltip key={cell.day}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {cellNode}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <ul className="flex flex-col gap-1">
                  {cell.items.map((item) => (
                    <li key={item.id} className="tnum">
                      {item.name} — {currency(item.amount)} ({item.status})
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4">
        {(Object.keys(DOT) as OccurrenceStatus[]).map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", DOT[status])} aria-hidden />
            <span className="text-label-md text-on-surface-variant">{status}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

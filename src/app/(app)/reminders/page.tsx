import type { Metadata } from "next";

import { CreateReminderDialog } from "@/components/modals/create-reminder-dialog";
import { ReminderCalendar } from "@/components/reminders/reminder-calendar";
import { ReminderGroups } from "@/components/reminders/reminder-groups";
import {
  getAccounts,
  getCategories,
  getGroupedReminders,
  getReminderCalendar,
  getReminderRules,
} from "@/lib/api/queries";

export const metadata: Metadata = { title: "Reminders" };

/**
 * The calendar month lives in the URL (`?year=2026&month=8`), so paging through months is a server
 * render against a real query rather than client-side slicing of a fixed array. It also means a
 * particular month is linkable.
 */
export default async function RemindersPage({ searchParams }: PageProps<"/reminders">) {
  const params = await searchParams;

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const today = new Date();
  const year = Number(first(params.year) ?? today.getFullYear());
  const month = Number(first(params.month) ?? today.getMonth() + 1);

  // Guard the parsed values: ?month=99 would otherwise reach the backend and come back empty with
  // no explanation.
  const safeYear = Number.isInteger(year) && year > 1970 && year < 2200 ? year : today.getFullYear();
  const safeMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : today.getMonth() + 1;

  const [occurrences, grouped, accounts, categories, rules] = await Promise.all([
    getReminderCalendar(safeYear, safeMonth),
    getGroupedReminders(),
    getAccounts(),
    getCategories("BILL"),
    // The rules themselves, so each occurrence row's menu can populate an edit form. An occurrence
    // carries only its reminderId and name.
    getReminderRules(),
  ]);

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex justify-end">
        <CreateReminderDialog accounts={accounts} categories={categories} />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ReminderCalendar
            year={safeYear}
            month={safeMonth}
            occurrences={occurrences}
          />
        </div>

        <div className="lg:col-span-4">
          <ReminderGroups
            grouped={grouped}
            rules={rules}
            accounts={accounts}
            categories={categories}
          />
        </div>
      </div>
    </div>
  );
}

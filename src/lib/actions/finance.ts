"use server";

import { revalidatePath } from "next/cache";

import { ApiError, api, routes } from "@/lib/api/client";
import type {
  BudgetStatus,
  Goal,
  ReminderOccurrence,
  ReminderRule,
  Transaction,
} from "@/lib/api/types";

/**
 * Every write in the application.
 *
 * <p>Two things each action does, and both matter:
 * <ol>
 *   <li><b>Refreshes exactly the affected routes.</b> Adding a transaction changes the ledger, the
 *       dashboard, the budgets and the reports — but not the settings screen. What is being
 *       invalidated here is the rendered RSC payload and the client Router Cache, NOT a data cache;
 *       there is no data cache on this side (see the note in {@code lib/api/client.ts}). Without
 *       these calls, navigating back to a screen after a mutation shows the previously rendered
 *       HTML.</li>
 *   <li><b>Returns a serialisable result rather than throwing.</b> An exception in a Server Action
 *       reaches the client as an opaque "An error occurred in the Server Components render" with
 *       the real message stripped in production. Returning the message keeps the toast useful.</li>
 * </ol>
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function failure(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof ApiError) {
    return {
      ok: false,
      error: error.message,
      fieldErrors:
        Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : undefined,
    };
  }
  return { ok: false, error: fallback };
}

/**
 * Anything a transaction write affects. The ledger is the hub — every dashboard number is an
 * aggregate over it — so this list is the longest one here. Settings is deliberately absent.
 */
function refreshLedgerViews() {
  revalidatePath(routes.dashboard);
  revalidatePath(routes.transactions);
  revalidatePath(routes.budgets);   // spend against limit moved
  revalidatePath(routes.reports);   // every aggregate moved
  revalidatePath(routes.settings);  // account balances are shown there
  revalidatePath(routes.goals);     // an expense can fund a goal, moving its progress
}

/* ---------------------------------------------------------- transactions -- */

export type TransactionInput = {
  date: string;
  description: string;
  amount: number;
  expense: boolean;
  accountId: string;
  categoryId?: string;
  notes?: string;
  /**
   * Optional goal this expense funds.
   *
   * Sent with the transaction rather than posted separately to
   * `/api/goals/{id}/contributions`, so the ledger row and the contribution are written in one
   * database transaction. Two calls would leave an orphaned expense behind any failure between
   * them, and nothing would reconcile it. Only valid when `expense` is true.
   */
  goalId?: string;
};

export async function createTransaction(
  input: TransactionInput,
): Promise<ActionResult<Transaction>> {
  try {
    const created = await api.post<Transaction>("/api/transactions", input);
    refreshLedgerViews();
    return { ok: true, data: created };
  } catch (error) {
    return failure(error, "Could not save the transaction.");
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/api/transactions/${id}`);
    refreshLedgerViews();
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not delete the transaction.");
  }
}

/* --------------------------------------------------------------- budgets -- */

export type BudgetInput = {
  categoryId: string;
  limit: number;
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  notifyEnabled: boolean;
  notifyThresholdPct?: number;
};

export async function createBudget(
  input: BudgetInput,
): Promise<ActionResult<BudgetStatus>> {
  try {
    const created = await api.post<BudgetStatus>("/api/budgets", input);
    revalidatePath(routes.budgets);
    revalidatePath(routes.dashboard);
    return { ok: true, data: created };
  } catch (error) {
    return failure(error, "Could not create the budget.");
  }
}

/**
 * PUT /api/budgets/{id}.
 *
 * The backend answers 204 with no body, so unlike createBudget there is nothing to return and the
 * caller re-renders from the revalidated page instead of from a response.
 *
 * NOTE: the backend ignores `categoryId` on update — a budget cannot be moved to another
 * category, only edited in place. It is still sent because the request DTO requires it. The edit
 * dialog therefore shows the category as read-only rather than offering a picker that would appear
 * to work and silently do nothing.
 */
export async function updateBudget(
  id: string,
  input: BudgetInput,
): Promise<ActionResult> {
  try {
    await api.put(`/api/budgets/${id}`, input);
    revalidatePath(routes.budgets);
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not update the budget.");
  }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/api/budgets/${id}`);
    revalidatePath(routes.budgets);
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not delete the budget.");
  }
}

/* ----------------------------------------------------------------- goals -- */

export type GoalInput = {
  name: string;
  icon?: string;
  target: number;
  targetDate?: string;
  categoryId?: string;
  description?: string;
};

export async function createGoal(input: GoalInput): Promise<ActionResult<Goal>> {
  try {
    const created = await api.post<Goal>("/api/goals", input);
    revalidatePath(routes.goals);
    revalidatePath(routes.dashboard);
    return { ok: true, data: created };
  } catch (error) {
    return failure(error, "Could not create the goal.");
  }
}

export async function contributeToGoal(
  goalId: string,
  amount: number,
  occurredOn?: string,
): Promise<ActionResult<Goal>> {
  try {
    const updated = await api.post<Goal>(`/api/goals/${goalId}/contributions`, {
      amount,
      occurredOn,
    });
    revalidatePath(routes.goals);
    revalidatePath(routes.dashboard);
    return { ok: true, data: updated };
  } catch (error) {
    return failure(error, "Could not record the contribution.");
  }
}

/**
 * PUT /api/goals/{id}.
 *
 * Returns the updated goal rather than void: the backend recomputes `status` against the new
 * target, so raising the target of a reached goal drops it back to ACTIVE. The caller needs that
 * to avoid leaving a stale "Reached" badge on the card.
 */
export async function updateGoal(
  id: string,
  input: GoalInput,
): Promise<ActionResult<Goal>> {
  try {
    const updated = await api.put<Goal>(`/api/goals/${id}`, input);
    revalidatePath(routes.goals);
    revalidatePath(routes.dashboard);
    return { ok: true, data: updated };
  } catch (error) {
    return failure(error, "Could not update the goal.");
  }
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/api/goals/${id}`);
    revalidatePath(routes.goals);
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not delete the goal.");
  }
}

/* ------------------------------------------------------------- reminders -- */

export type ReminderInput = {
  name: string;
  amount: number;
  frequency: "ONE_TIME" | "WEEKLY" | "MONTHLY" | "YEARLY";
  firstDueOn: string;
  categoryId?: string;
  accountId?: string;
  autopayEnabled: boolean;
  notifyEnabled: boolean;
  notifyDaysBefore?: number;
};

export async function createReminder(
  input: ReminderInput,
): Promise<ActionResult<ReminderRule>> {
  try {
    const created = await api.post<ReminderRule>("/api/reminders", input);
    revalidatePath(routes.reminders);
    revalidatePath(routes.dashboard);
    return { ok: true, data: created };
  } catch (error) {
    return failure(error, "Could not create the reminder.");
  }
}

/**
 * Pay Now. This one writes a ledger row on the backend, so it invalidates the ledger tags too —
 * missing that is how the reminder flips to Paid while the dashboard keeps the old balance.
 */
export async function payOccurrence(
  occurrenceId: string,
  accountId?: string,
): Promise<ActionResult<ReminderOccurrence>> {
  try {
    const paid = await api.post<ReminderOccurrence>(
      `/api/reminders/occurrences/${occurrenceId}/pay`,
      accountId ? { accountId } : {},
    );
    revalidatePath(routes.reminders);
    refreshLedgerViews();
    return { ok: true, data: paid };
  } catch (error) {
    return failure(error, "Could not pay this bill.");
  }
}

export async function deleteReminder(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/api/reminders/${id}`);
    revalidatePath(routes.reminders);
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not delete the reminder.");
  }
}

/* ------------------------------------------------------------- accounts -- */

export type AccountInput = {
  name: string;
  kind: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "CASH";
  institution?: string;
  mask?: string;
  currency: string;
  openingBalance: number;
};

export async function createAccount(input: AccountInput): Promise<ActionResult> {
  try {
    await api.post("/api/accounts", input);
    revalidatePath(routes.settings);
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not link the account.");
  }
}

export async function removeAccount(id: string): Promise<ActionResult> {
  try {
    await api.delete(`/api/accounts/${id}`);
    revalidatePath(routes.settings);
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not remove the account.");
  }
}

/* --------------------------------------------------------- notifications -- */

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    await api.post(`/api/notifications/${id}/read`);
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not mark it read.");
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    await api.post("/api/notifications/read-all");
    revalidatePath(routes.dashboard);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Could not mark them read.");
  }
}

/** The backend's "check now" scan. Useful for seeing the live SSE stream do something. */
export async function scanForNotifications(): Promise<ActionResult<{ created: number }>> {
  try {
    const result = await api.post<{ created: number }>("/api/notifications/scan");
    revalidatePath(routes.dashboard);
    return { ok: true, data: result };
  } catch (error) {
    return failure(error, "Could not run the check.");
  }
}

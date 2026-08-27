import { api } from "./client";
import type {
  Account,
  BudgetRollup,
  BudgetStatus,
  CashflowPoint,
  Category,
  CategoryKind,
  CategorySpend,
  Dashboard,
  Goal,
  GroupedOccurrences,
  Me,
  NetWorthReport,
  NotificationList,
  Page,
  ReminderOccurrence,
  ReminderRule,
  SpendingTrend,
  Transaction,
} from "./types";

/**
 * Read functions, one per backend endpoint, grouped by screen.
 *
 * <p>Server-only. Pages call these directly — there is no client-side data layer, no SWR, no React
 * Query, because with Server Components the fetch happens during render and the result is already
 * in the HTML. Nothing to hydrate, no loading spinner on first paint.
 */

/* ------------------------------------------------------------------ auth -- */

export const getMe = () => api.get<Me>("/api/auth/me");

/* ------------------------------------------------------------- dashboard -- */

export const getDashboard = () =>
  api.get<Dashboard>("/api/dashboard");

/* ---------------------------------------------------------- transactions -- */

export type TransactionQuery = {
  from?: string;
  to?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  size?: number;
};

export function getTransactions(query: TransactionQuery = {}) {
  const params = new URLSearchParams();

  // Only send parameters that are actually set: the backend treats a missing value as "no filter",
  // and an empty string would be a filter for the empty string.
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.search) params.set("search", query.search);
  params.set("page", String(query.page ?? 0));
  params.set("size", String(query.size ?? 10));

  return api.get<Page<Transaction>>(`/api/transactions?${params}`);
}

/* ------------------------------------------------------ accounts & categories -- */

export const getAccounts = () =>
  api.get<Account[]>("/api/accounts");

export function getCategories(kind?: CategoryKind) {
  const path = kind ? `/api/categories?kind=${kind}` : "/api/categories";
  return api.get<Category[]>(path);
}

/* --------------------------------------------------------------- budgets -- */

export const getBudgets = () =>
  api.get<BudgetStatus[]>("/api/budgets");

export const getBudgetRollup = () =>
  api.get<BudgetRollup>("/api/budgets/rollup");

/* ----------------------------------------------------------------- goals -- */

export const getGoals = () => api.get<Goal[]>("/api/goals");

/* ------------------------------------------------------------- reminders -- */

export const getReminderRules = () =>
  api.get<ReminderRule[]>("/api/reminders");

export function getReminderCalendar(year: number, month: number) {
  return api.get<ReminderOccurrence[]>(
    `/api/reminders/calendar?year=${year}&month=${month}`,
  );
}

export const getGroupedReminders = () =>
  api.get<GroupedOccurrences>("/api/reminders/grouped");

/* --------------------------------------------------------------- reports -- */

export function getNetWorth(year?: number) {
  const path = year ? `/api/reports/net-worth?year=${year}` : "/api/reports/net-worth";
  return api.get<NetWorthReport>(path);
}

export const getIncomeVsExpenses = (months = 5) =>
  api.get<CashflowPoint[]>(`/api/reports/income-vs-expenses?months=${months}`);

export const getSpendingTrend = (days = 30) =>
  api.get<SpendingTrend>(`/api/reports/spending-trend?days=${days}`);

export const getTopCategories = (limit = 8) =>
  api.get<CategorySpend[]>(`/api/reports/top-categories?limit=${limit}`);

/* --------------------------------------------------------- notifications -- */

export const getNotifications = (limit = 20) =>
  api.get<NotificationList>(`/api/notifications?limit=${limit}`);

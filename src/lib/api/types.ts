/**
 * Mirrors of the backend DTOs in `../../../backend/src/main/java/com/myfinance`.
 *
 * Two conventions that come from the backend's Jackson configuration and matter here:
 *
 * 1. `spring.jackson.default-property-inclusion: non_null` means **null fields are omitted from
 *    the JSON entirely**, not sent as `null`. So anything the server may not have is declared
 *    optional (`?`) rather than `| null`. Getting this wrong produces `undefined` at runtime while
 *    the types claim otherwise.
 * 2. **Money crosses the wire in major units** as a JSON number (`124.5`), because the existing
 *    `lib/format.ts` already speaks major units. The backend stores integer minor units and
 *    converts at its edge.
 */

/* ------------------------------------------------------------------ auth -- */

export type Theme = "LIGHT" | "DARK" | "SYSTEM";

export type UserPreferences = {
  userId: string;
  budgetAlerts: boolean;
  billReminders: boolean;
  weeklyDigest: boolean;
  reminderLeadDays: number;
  theme: Theme;
  updatedAt: string;
};

/** POST /api/auth/login and /api/auth/register. `token` is shown exactly once. */
export type SessionResponse = {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  baseCurrency: string;
};

/** GET /api/auth/me */
export type Me = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  baseCurrency: string;
  twoFactorEnabled: boolean;
  preferences: UserPreferences;
};

/* ------------------------------------------------------ accounts & categories -- */

export type AccountKind = "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "CASH";

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  institution?: string;
  mask?: string;
  /** What the ledger's Method column renders, e.g. "•••• 4242". */
  methodLabel: string;
  currency: string;
  balance: number;
  active: boolean;
  lastSyncedAt?: string;
};

export type CategoryKind = "EXPENSE" | "INCOME" | "BILL" | "GOAL";

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  icon?: string;
  color?: string;
  systemDefault: boolean;
};

/* ----------------------------------------------------------- transactions -- */

export type TransactionDirection = "DEBIT" | "CREDIT";
export type TransactionStatus = "CLEARED" | "PENDING" | "OVERDUE";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  categoryId?: string;
  category?: string;
  accountId: string;
  account: string;
  method: string;
  /** Signed: negative is money out. */
  amount: number;
  direction: TransactionDirection;
  status: TransactionStatus;
  notes?: string;
};

/**
 * Spring Data's `Page<T>` serialisation. Only the fields the UI actually reads are declared —
 * the real payload also carries `pageable`, `sort` and `empty`.
 */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** Zero-based. */
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
};

/* ---------------------------------------------------------------- budgets -- */

export type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

/** Green / Yellow / Red, decided server-side so the two codebases cannot disagree. */
export type BudgetTone = "GOOD" | "WARNING" | "CRITICAL";

export type BudgetStatus = {
  id: string;
  categoryId: string;
  category: string;
  icon?: string;
  period: BudgetPeriod;
  windowStart: string;
  windowEnd: string;
  limit: number;
  spent: number;
  remaining: number;
  usedPercent: number;
  tone: BudgetTone;
};

export type BudgetRollup = {
  limit: number;
  spent: number;
  remaining: number;
  usedPercent: number;
};

/* ------------------------------------------------------------------ goals -- */

export type GoalStatus = "ACTIVE" | "REACHED" | "ARCHIVED";

export type Goal = {
  id: string;
  name: string;
  icon?: string;
  target: number;
  saved: number;
  percent: number;
  targetDate?: string;
  /** The "Est. Dec 2024" line. Absent when there is not enough history to project. */
  projectedCompletion?: string;
  status: GoalStatus;
};

/* -------------------------------------------------------------- reminders -- */

export type ReminderFrequency = "ONE_TIME" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type OccurrenceStatus = "UNPAID" | "SCHEDULED" | "PAID";

export type ReminderRule = {
  id: string;
  name: string;
  categoryId?: string;
  accountId?: string;
  amount: number;
  frequency: ReminderFrequency;
  firstDueOn: string;
  autopayEnabled: boolean;
  notifyEnabled: boolean;
  notifyDaysBefore: number;
  active: boolean;
};

export type ReminderOccurrence = {
  id: string;
  reminderId: string;
  name: string;
  dueOn: string;
  amount: number;
  status: OccurrenceStatus;
};

export type GroupedOccurrences = {
  dueTomorrow: ReminderOccurrence[];
  nextWeek: ReminderOccurrence[];
  laterThisMonth: ReminderOccurrence[];
};

/* -------------------------------------------------------------- dashboard -- */

export type SummaryTiles = {
  totalBalance: number;
  income: number;
  expenses: number;
  savings: number;
  balanceDelta?: string;
  incomeDelta?: string;
  expensesDelta?: string;
  savingsRate?: string;
};

export type SeriesPoint = { date: string; label: string; amount: number };

export type Cashflow = { income: number; expenses: number; savings: number };

export type CategorySlice = {
  label: string;
  icon?: string;
  color?: string;
  amount: number;
  share: number;
};

/** GET /api/dashboard — one payload, assembled from eight concurrent backend queries. */
export type Dashboard = {
  summary: SummaryTiles;
  spendingSeries: SeriesPoint[];
  cashflow: Cashflow;
  categoryBreakdown: CategorySlice[];
  upcomingPayments: ReminderOccurrence[];
  recentTransactions: Transaction[];
  monthlyBudget: BudgetRollup;
  goals: Goal[];
};

/* ---------------------------------------------------------------- reports -- */

export type ReportPoint = { date: string; label: string; value: number };

export type NetWorthReport = {
  total: number;
  yearOverYear?: string;
  series: ReportPoint[];
};

export type CashflowPoint = { label: string; income: number; expenses: number };

export type SpendingTrend = {
  total: number;
  perDay: number;
  series: ReportPoint[];
};

export type CategorySpend = {
  label: string;
  icon?: string;
  amount: number;
  share: number;
};

/* ---------------------------------------------------------- notifications -- */

export type NotificationKind =
  | "BUDGET_ALERT"
  | "BILL_DUE"
  | "GOAL_REACHED"
  | "WEEKLY_DIGEST";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  subjectType?: string;
  subjectId?: string;
  unread: boolean;
  createdAt: string;
};

export type NotificationList = {
  items: Notification[];
  unread: number;
};

/* --------------------------------------------------------------------- fx -- */

export type FxRates = {
  base: string;
  fetchedAt: string;
  rates: Record<string, number>;
  /** True when the upstream failed and the backend degraded rather than erroring. */
  stale: boolean;
};

/* ------------------------------------------------------------------ errors -- */

/** The shape produced by the backend's GlobalExceptionHandler. */
export type ApiErrorBody = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  /** Present on 400s from Bean Validation: one entry per offending field. */
  fields?: Record<string, string>;
};

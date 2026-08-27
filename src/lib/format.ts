const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** $2,450.00 */
export function currency(value: number) {
  return usd.format(value);
}

/** $2,450 — for chart axes and dense summaries */
export function currencyRound(value: number) {
  return usdCompact.format(value);
}

/** - $124.50 / + $4,250.00 — signed money, as rendered in the transaction ledger */
export function signedCurrency(value: number) {
  const sign = value < 0 ? "-" : "+";
  return `${sign} ${usd.format(Math.abs(value))}`;
}

/** $1.5k — compact axis ticks */
export function currencyAxis(value: number) {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${value}`;
}

export function percent(value: number, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`;
}

/** Oct 24, 2023 */
export function longDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Aug 28 */
export function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

/**
 * "Due Tomorrow" / "Due Today" / "Overdue" for a due date, or null when it is far enough out that
 * the plain date reads better.
 *
 * <p>Computed here, on the client, on purpose: this label depends on *today*, so a value cached or
 * rendered server-side hours earlier would be wrong. The backend deliberately returns dates and
 * leaves the wording to the reader — SCHEMA.md lists these labels as read models for that reason.
 */
export function relativeDueLabel(iso: string): string | null {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const due = new Date(`${iso}T00:00:00`);
  const days = Math.round((due.getTime() - startOfToday.getTime()) / 86_400_000);

  if (days < 0) return "Overdue";
  if (days === 0) return "Due Today";
  if (days === 1) return "Due Tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return null;
}

import { CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

import { currency, signedCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Currency value with tabular figures so columns align (DESIGN.md § Typography). */
export function Money({
  value,
  className,
  signed = false,
}: {
  value: number;
  className?: string;
  signed?: boolean;
}) {
  return (
    <span className={cn("tnum text-data", className)}>
      {signed ? signedCurrency(value) : currency(value)}
    </span>
  );
}

/** Signed ledger amount — green for money in, red for money out. */
export function LedgerAmount({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <Money
      value={value}
      signed
      className={cn(
        value > 0 ? "text-success" : "text-danger",
        className,
      )}
    />
  );
}

/** Direction of a period-over-period change. */
export type Trend = "up" | "down" | "neutral";

const TREND = {
  up: { icon: TrendingUp, className: "text-success" },
  down: { icon: TrendingDown, className: "text-danger" },
  neutral: { icon: CheckCircle2, className: "text-brand-container" },
} as const;

/** Period-over-period delta. Direction is carried by the icon, not just color. */
export function TrendDelta({
  trend,
  children,
  className,
}: {
  trend: Trend;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass } = TREND[trend];

  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1 text-data",
        toneClass,
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </span>
  );
}

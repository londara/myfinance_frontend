import { cn } from "@/lib/utils";

export type MeterTone = "good" | "warning" | "critical" | "brand";

const FILL: Record<MeterTone, string> = {
  good: "bg-success",
  warning: "bg-warning",
  critical: "bg-danger",
  brand: "bg-brand-container",
};

/**
 * Budget / goal progress bar. 8px height, rounded caps, Slate-100 track, fill
 * color determined by status (DESIGN.md § Progress Bars).
 */
export function Meter({
  value,
  tone = "brand",
  height = 8,
  label,
  className,
}: {
  /** 0–100+; renders clamped but keeps the true value in the a11y attributes */
  value: number;
  tone?: MeterTone;
  height?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{ height }}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-low",
        className,
      )}
    >
      <div
        style={{ width: `${clamped}%` }}
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          FILL[tone],
        )}
      />
    </div>
  );
}

/**
 * Spend-against-limit tone (DESIGN.md § Progress Bars — Green / Yellow / Red).
 * Monotonic on purpose: the further into the limit you are, the hotter the bar.
 */
export function budgetTone(spent: number, limit: number): MeterTone {
  const ratio = limit === 0 ? 0 : spent / limit;
  if (ratio > 1) return "critical";
  if (ratio >= 0.8) return "warning";
  return "good";
}

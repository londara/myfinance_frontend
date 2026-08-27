import { CheckCircle2, Clock, AlertTriangle, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";


const TONE = {
  cleared: {
    className: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  paid: {
    className: "bg-success/10 text-success",
    icon: CheckCircle2,
  },
  pending: {
    className: "bg-warning/10 text-warning",
    icon: Clock,
  },
  overdue: {
    className: "bg-danger/10 text-danger",
    icon: AlertTriangle,
  },
  scheduled: {
    className: "bg-surface-highest text-on-surface-variant",
    icon: CalendarClock,
  },
} as const;

export type Tone = keyof typeof TONE;

/**
 * Pill-shaped state indicator. Status is never color-alone — each chip pairs a
 * tinted background with a full-saturation label and an icon.
 */
export function StatusChip({
  label,
  tone,
  className,
}: {
  label: string;
  tone: Tone;
  className?: string;
}) {
  const { className: toneClass, icon: Icon } = TONE[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-md font-semibold whitespace-nowrap",
        toneClass,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  cleared: "cleared",
  paid: "paid",
  pending: "pending",
  overdue: "overdue",
  unpaid: "overdue",
  scheduled: "scheduled",
};

export function statusTone(status: string): Tone {
  return STATUS_TONE[status.toLowerCase()] ?? "scheduled";
}

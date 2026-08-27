import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label-above-field group (DESIGN.md § Input Fields). */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  action,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  /** Replaces the hint and turns the message red when set. */
  error?: string;
  /** Trailing control on the label row — e.g. a "Forgot password?" link. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor} className="fin-label">
          {label}
        </Label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-label-md font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-label-md text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

/** Two fields side by side on desktop, stacked on mobile. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/** A labelled switch row, used for the notification / auto-pay toggles. */
export function ToggleRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-title-md text-on-surface">{title}</p>
        <p className="mt-0.5 text-body-md text-on-surface-variant">
          {description}
        </p>
      </div>
      <div className="pt-1">{children}</div>
    </div>
  );
}

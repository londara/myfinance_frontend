import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Level 1 surface — the primary unit of the dashboard.
 * White, 16px radius, 1px border, soft shadow (DESIGN.md § Elevation).
 */
export function SectionCard({
  className,
  children,
  interactive = false,
  ...props
}: React.ComponentProps<"section"> & {
  interactive?: boolean;
}) {
  return (
    <section
      {...props}
      className={cn(
        interactive ? "fin-card-interactive" : "fin-card",
        "p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Card header: title-md heading plus an optional trailing action. */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-title-md text-brand">{title}</h2>
        {description ? (
          <p className="mt-1 text-label-md text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

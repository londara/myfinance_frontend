"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * One dialog chrome for every create flow: Level 2 elevation, a bordered header, a scrollable body,
 * and a footer on the low surface with Cancel + a primary action. Keeps all four modals identical.
 *
 * <p>The form submits as a real `<form>` and the handler receives `FormData`, rather than each
 * dialog wiring up controlled state for every input. Uncontrolled inputs plus one FormData read at
 * submit time is less code and fewer re-renders, and it is what a Server Action would consume if
 * these were progressively enhanced later.
 */
export function FormDialogContent({
  title,
  description,
  submitLabel,
  submitDisabled = false,
  submitIcon,
  onSubmitData,
  children,
  className,
}: {
  title: string;
  description?: string;
  submitLabel: string;
  submitDisabled?: boolean;
  /** Rendered before the label, e.g. a spinner while the action is in flight. */
  submitIcon?: ReactNode;
  onSubmitData: (formData: FormData) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogContent
      showCloseButton
      className={cn(
        "gap-0 overflow-hidden rounded-card border border-border p-0 shadow-[var(--shadow-level-2)] ring-0 sm:max-w-lg",
        className,
      )}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitData(new FormData(event.currentTarget));
        }}
        className="flex max-h-[85vh] flex-col"
      >
        <DialogHeader className="gap-1 border-b border-border px-6 py-4 pr-14 text-left">
          <DialogTitle className="text-title-lg text-brand">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-body-md text-on-surface-variant">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">{children}</div>

        <div className="flex justify-end gap-3 border-t border-border bg-surface-low px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={submitDisabled}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={submitDisabled}>
            {submitIcon}
            {submitLabel}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Car, Home, Loader2, PiggyBank, Plane, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Field, FieldRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGoal, updateGoal } from "@/lib/actions/finance";
import type { Category, Goal } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** The keys match what the backend stores and the goals page maps back to a component. */
const ICONS = [
  { id: "piggy", label: "Savings", Icon: PiggyBank },
  { id: "plane", label: "Travel", Icon: Plane },
  { id: "home", label: "Home", Icon: Home },
  { id: "car", label: "Vehicle", Icon: Car },
  { id: "trophy", label: "Milestone", Icon: Trophy },
];

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * One dialog for adding and editing a goal.
 *
 * <p>Create and edit share every field and every rule, so they are one component with a `goal` prop
 * rather than two that drift apart — the same arrangement as `BudgetFormDialog`. Passing a `goal`
 * switches the title, the submit label and the action.
 *
 * <p>*Controlled* on purpose: add is launched from two different triggers (the header button and the
 * ghost card) while edit comes from a card's dropdown, so the trigger cannot live in here.
 * {@link AddGoalDialog} is the thin wrapper that supplies one.
 */
export function GoalFormDialog({
  open,
  onOpenChange,
  categories,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  /** Present means edit. Absent means create. */
  goal?: Goal;
}) {
  const router = useRouter();
  const editing = goal !== undefined;

  /*
   * The icon picker is the one controlled field, because it is a radiogroup of buttons rather than a
   * native input, so it has no FormData value of its own.
   *
   * Keyed remount is what keeps it honest: `useState` only takes its initial value once, so without
   * the `key` on the body below, opening the dialog for a second goal would keep the first goal's
   * icon selected. The rest of the form is uncontrolled and re-initialises from `defaultValue`.
   */
  const [icon, setIcon] = useState(goal?.icon ?? "piggy");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function settle() {
    setFieldErrors({});
    onOpenChange(false);
    router.refresh();
  }

  function onSubmit(formData: FormData) {
    const target = Number(formData.get("target"));

    if (!Number.isFinite(target) || target <= 0) {
      setFieldErrors({ target: "Enter a target greater than zero." });
      return;
    }

    const categoryId = String(formData.get("categoryId") ?? "");
    const targetDate = String(formData.get("targetDate") ?? "");
    const description = String(formData.get("description") ?? "");

    const input = {
      name: String(formData.get("name")).trim(),
      icon,
      target,
      targetDate: targetDate || undefined,
      categoryId: categoryId || undefined,
      description: description || undefined,
    };

    // Split rather than a ternary over the two actions: they resolve to different payload types,
    // so a union would not narrow in the success branch. Same reason as BudgetFormDialog.
    startTransition(async () => {
      if (editing) {
        const result = await updateGoal(goal.id, input);

        if (!result.ok) {
          setFieldErrors(result.fieldErrors ?? {});
          toast.error("Could not update the goal", { description: result.error });
          return;
        }

        settle();
        toast.success("Goal updated", {
          // Worth surfacing: the backend re-derives status from the new target, so an edit can
          // take a goal out of "Reached" — surprising unless it is said out loud.
          description:
            result.data.status === "REACHED"
              ? `${result.data.name} — target met.`
              : `${result.data.name} — now at ${Math.round(result.data.percent)}% of target.`,
        });
        return;
      }

      const result = await createGoal(input);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not create the goal", { description: result.error });
        return;
      }

      settle();
      toast.success("Goal created", {
        // A brand new goal shows 0% and no projection until contributions exist.
        description: "Record a contribution to start tracking progress.",
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent
        title={editing ? "Edit Goal" : "Add New Goal"}
        description={
          editing
            ? "Progress is recalculated from your contributions, so changing the target updates the card immediately."
            : undefined
        }
        submitLabel={
          pending ? (editing ? "Saving…" : "Creating…") : editing ? "Save Changes" : "Create Goal"
        }
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <div key={goal?.id ?? "create"} className="flex flex-col gap-5">
          <Field label="Goal Name" htmlFor="goal-name" error={fieldErrors.name}>
            <Input
              id="goal-name"
              name="name"
              placeholder="e.g. European Vacation"
              defaultValue={goal?.name}
              maxLength={120}
              required
            />
          </Field>

          <FieldRow>
            <Field label="Target Amount" htmlFor="goal-amount" error={fieldErrors.target}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-on-surface-variant">
                  $
                </span>
                <Input
                  id="goal-amount"
                  name="target"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={goal ? goal.target : undefined}
                  className="tnum pl-7"
                  required
                />
              </div>
            </Field>

            <Field label="Target Date" htmlFor="goal-date">
              <Input
                id="goal-date"
                name="targetDate"
                type="date"
                defaultValue={goal?.targetDate ?? ""}
              />
            </Field>
          </FieldRow>

          {categories.length > 0 ? (
            <Field label="Goal Category" htmlFor="goal-category">
              <select
                id="goal-category"
                name="categoryId"
                defaultValue={goal?.categoryId ?? ""}
                className={SELECT_CLASS}
              >
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label className="fin-label">Goal Icon</Label>
            <div role="radiogroup" aria-label="Goal icon" className="flex flex-wrap gap-3">
              {ICONS.map(({ id, label, Icon }) => {
                const selected = icon === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={label}
                    onClick={() => setIcon(id)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                      selected
                        ? "border-brand-container bg-brand-fixed text-brand-container"
                        : "border-border text-on-surface-variant hover:bg-surface-high",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Description (Optional)" htmlFor="goal-notes">
            <Textarea
              id="goal-notes"
              name="description"
              rows={3}
              maxLength={1000}
              placeholder="Brief notes about this goal…"
              defaultValue={goal?.description ?? ""}
              className="resize-none"
            />
          </Field>
        </div>
      </FormDialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Car, Home, Loader2, PiggyBank, Plane, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Field, FieldRow } from "@/components/shared/field";
import { FormDialogContent } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGoal } from "@/lib/actions/finance";
import type { Category } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** The keys match what the backend stores and the goals page maps back to a component. */
const ICONS = [
  { id: "piggy", label: "Savings", Icon: PiggyBank },
  { id: "plane", label: "Travel", Icon: Plane },
  { id: "home", label: "Home", Icon: Home },
  { id: "car", label: "Vehicle", Icon: Car },
  { id: "trophy", label: "Milestone", Icon: Trophy },
];

export function AddGoalDialog({
  categories,
  trigger,
}: {
  categories: Category[];
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState("piggy");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const target = Number(formData.get("target"));

    if (!Number.isFinite(target) || target <= 0) {
      setFieldErrors({ target: "Enter a target greater than zero." });
      return;
    }

    startTransition(async () => {
      const categoryId = String(formData.get("categoryId") ?? "");
      const targetDate = String(formData.get("targetDate") ?? "");

      const result = await createGoal({
        name: String(formData.get("name")).trim(),
        icon,
        target,
        targetDate: targetDate || undefined,
        categoryId: categoryId || undefined,
        description: String(formData.get("description") ?? "") || undefined,
      });

      if (result.ok) {
        setFieldErrors({});
        setOpen(false);
        toast.success("Goal created", {
          // Worth saying: a brand new goal shows 0% and no projection until contributions exist.
          description: "Record a contribution to start tracking progress.",
        });
        router.refresh();
      } else {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error("Could not create the goal", { description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>Add New Goal</Button>}</DialogTrigger>

      <FormDialogContent
        title="Add New Goal"
        submitLabel={pending ? "Creating…" : "Create Goal"}
        submitDisabled={pending}
        submitIcon={pending ? <Loader2 className="animate-spin" /> : undefined}
        onSubmitData={onSubmit}
      >
        <Field label="Goal Name" htmlFor="goal-name" error={fieldErrors.name}>
          <Input
            id="goal-name"
            name="name"
            placeholder="e.g. European Vacation"
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
                className="tnum pl-7"
                required
              />
            </div>
          </Field>

          <Field label="Target Date" htmlFor="goal-date">
            <Input id="goal-date" name="targetDate" type="date" />
          </Field>
        </FieldRow>

        {categories.length > 0 ? (
          <Field label="Goal Category" htmlFor="goal-category">
            <select
              id="goal-category"
              name="categoryId"
              defaultValue=""
              className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            className="resize-none"
          />
        </Field>
      </FormDialogContent>
    </Dialog>
  );
}

import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Too short", fill: "bg-danger", text: "text-danger" },
  { label: "Weak", fill: "bg-danger", text: "text-danger" },
  { label: "Fair", fill: "bg-warning", text: "text-warning" },
  { label: "Good", fill: "bg-success", text: "text-success" },
  { label: "Strong", fill: "bg-success", text: "text-success" },
] as const;

/** 0–4. Length carries the most weight; variety breaks the ties. */
export function scorePassword(value: string) {
  if (!value) return 0;
  if (value.length < 8) return 1;

  let score = 2;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(value),
  ).length;

  if (variety >= 3) score += 1;
  if (value.length >= 12 && variety >= 3) score += 1;

  return Math.min(4, score);
}

/**
 * Four-segment strength meter. The word carries the verdict; the color only
 * reinforces it, so the meaning survives without color.
 */
export function PasswordStrength({ value }: { value: string }) {
  const score = scorePassword(value);
  const level = LEVELS[score];

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              score >= segment ? level.fill : "bg-surface-high",
            )}
          />
        ))}
      </div>
      <p className="text-label-md text-on-surface-variant">
        Password strength:{" "}
        <span className={cn("font-semibold", value && level.text)}>
          {value ? level.label : "—"}
        </span>
      </p>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { ThemeToggleButton } from "@/components/theme/theme-toggle";

const PROMISES = [
  "Every account in one ledger, reconciled daily.",
  "Budgets and goals that track themselves.",
  "Reports built for decisions, not decoration.",
];

/**
 * Two-panel auth layout. The left panel is the only place in the app that uses
 * a solid Deep Slate field — it anchors the brand before the product chrome
 * exists. Below `lg` it collapses and the form takes the full canvas.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Brand panel */}
      <aside className="relative hidden w-[45%] max-w-[620px] shrink-0 flex-col justify-between border-r border-[var(--auth-panel-edge)] bg-[var(--auth-panel)] p-edge text-white lg:flex">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-white/40"
        >
          <span className="flex size-9 items-center justify-center rounded bg-white text-title-md font-bold text-[#091426]">
            M
          </span>
          <span className="flex flex-col">
            <span className="text-title-lg font-bold">MyFinance</span>
            <span className="text-label-md text-white/60">
              Wealth Management
            </span>
          </span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-headline-lg text-white">
            Financial clarity,
            <br />
            by design.
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-3 text-white" aria-hidden />
                </span>
                <span className="text-body-lg text-white/75">{promise}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-label-md text-white/45">
          Bank-grade encryption. Read-only connections. Your data stays yours.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 p-gutter">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/30 lg:invisible"
          >
            <span className="flex size-8 items-center justify-center rounded bg-brand text-sm font-bold text-background">
              M
            </span>
            <span className="text-title-lg font-bold text-brand">
              MyFinance
            </span>
          </Link>
          <ThemeToggleButton />
        </div>

        <main className="flex flex-1 items-center justify-center px-gutter pb-stack-lg">
          <div className="w-full max-w-[440px]">
            <p className="text-label-md text-slate-ink uppercase">{eyebrow}</p>
            <h1 className="mt-2 text-headline-lg text-brand">{title}</h1>
            <p className="mt-2 text-body-lg text-on-surface-variant">
              {description}
            </p>

            <div className="mt-8">{children}</div>

            <p className="mt-8 text-center text-body-md text-on-surface-variant">
              {footer}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

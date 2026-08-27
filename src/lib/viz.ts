/**
 * Chart color roles, as CSS variables so light and dark resolve at paint time.
 * The values live in `globals.css`; the dark column is a set of steps *selected*
 * for the dark card surface, not a flip of the light one.
 *
 * Categorical slots are a validated fixed order (adjacent-pair CVD ΔE 9.1 light /
 * 8.4 dark, normal-vision ΔE 19.6 / 19.3, chroma and lightness bands pass in both
 * modes). Slots are assigned in order and never cycled — a 6th category folds
 * into "Other". Some slots sit below 3:1 against the surface, so every chart that
 * uses them also ships visible direct labels.
 *
 * Single-series charts use the brand ink instead — there is no identity to encode.
 */
export const viz = {
  /** Brand ink — single-series lines, areas and the savings mark */
  brand: "var(--viz-brand)",
  brandSoft: "var(--viz-brand-soft)",

  /** Fixed-order categorical slots */
  series: [
    "var(--viz-series-1)",
    "var(--viz-series-2)",
    "var(--viz-series-3)",
    "var(--viz-series-4)",
    "var(--viz-series-5)",
  ],

  /** Reserved status colors — never reused as a categorical slot */
  good: "var(--viz-good)",
  critical: "var(--viz-critical)",

  /** Recessive chrome */
  grid: "var(--viz-grid)",
  surface: "var(--viz-surface)",
} as const;

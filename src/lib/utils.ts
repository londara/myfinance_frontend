import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The design system's type scale uses named steps (`text-title-md`,
 * `text-label-md`, …). Out of the box tailwind-merge cannot tell those from text
 * *colors*, so `cn("text-title-md", "text-brand")` would silently drop the size.
 * Registering the scale as font-size keeps size and color independent.
 */
const FONT_SIZES = [
  "display-lg",
  "headline-lg",
  "headline-md",
  "title-lg",
  "title-md",
  "body-lg",
  "body-md",
  "label-md",
  "data",
];

const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES, "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

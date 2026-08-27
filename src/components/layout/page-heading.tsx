"use client";

import { usePathname } from "next/navigation";

import { pageMetaFor } from "@/lib/nav";

/**
 * The title and subtitle in the top bar.
 *
 * A tiny client component purely because it needs the current pathname. Keeping it separate means
 * the rest of the top bar stays a Server Component and its data fetching is not pushed to the
 * client just to read a route.
 */
export function PageHeading() {
  const meta = pageMetaFor(usePathname());

  return (
    <div className="min-w-0">
      <h1 className="truncate text-headline-md text-brand">{meta.title}</h1>
      <p className="truncate text-body-md text-on-surface-variant">{meta.subtitle}</p>
    </div>
  );
}

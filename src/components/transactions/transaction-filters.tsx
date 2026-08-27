"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/api/types";

const ALL = "all";

/**
 * The filter bar. Every control writes to the URL; the server does the filtering.
 *
 * <p>`useTransition` keeps the inputs responsive while the server re-renders — without it the whole
 * bar freezes for the duration of the request and typing feels broken.
 */
export function TransactionFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = {
    search: searchParams.get("search") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    categoryId: searchParams.get("categoryId") ?? ALL,
  };

  const hasFilters =
    Boolean(current.search || current.from || current.to) || current.categoryId !== ALL;

  function apply(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (!value || value === ALL) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    // Any filter change invalidates the current page number: being on page 4 of the old result set
    // says nothing about the new one, and a stale page can land on an empty screen.
    next.delete("page");

    startTransition(() => {
      // scroll: false keeps the viewport where it is; jumping to the top on each keystroke is
      // disorienting when the filter bar is what you are looking at.
      router.push(`/transactions?${next}`, { scroll: false });
    });
  }

  function clearAll() {
    startTransition(() => router.push("/transactions", { scroll: false }));
  }

  return (
    <div className="fin-card flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div
        className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
        data-pending={pending ? "" : undefined}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-search" className="fin-label">
            Search
          </Label>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-on-surface-variant"
              aria-hidden
            />
            <Input
              id="tx-search"
              // defaultValue, not value: this input is not controlled by React state, and the URL
              // is only written on Enter or blur so every keystroke is not a server round trip.
              defaultValue={current.search}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  apply("search", event.currentTarget.value.trim());
                }
              }}
              onBlur={(event) => {
                if (event.currentTarget.value.trim() !== current.search) {
                  apply("search", event.currentTarget.value.trim());
                }
              }}
              placeholder="Search description…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-from" className="fin-label">
            Date range
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="tx-from"
              type="date"
              defaultValue={current.from}
              onChange={(event) => apply("from", event.target.value)}
              className="w-full sm:w-40"
            />
            <span className="text-body-md text-on-surface-variant">to</span>
            <Input
              aria-label="Date range end"
              type="date"
              defaultValue={current.to}
              onChange={(event) => apply("to", event.target.value)}
              className="w-full sm:w-40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-category" className="fin-label">
            Category
          </Label>
          {/*
            A native select rather than the shadcn one: this needs to be a plain, uncontrolled
            input whose change goes straight to the router, and the styling matches the design
            tokens anyway.
          */}
          <select
            id="tx-category"
            defaultValue={current.categoryId}
            onChange={(event) => apply("categoryId", event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-body-md outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-48"
          >
            <option value={ALL}>All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex shrink-0 gap-3">
        {hasFilters ? (
          <Button variant="ghost" onClick={clearAll} disabled={pending}>
            <X data-icon="inline-start" />
            Clear
          </Button>
        ) : null}

        {/*
          A plain anchor, deliberately. The route handler sets
          Content-Disposition: attachment, so the browser downloads the file and stays on the
          page — no JavaScript, and nothing buffers the response into memory. Pulling it through
          fetch() into a blob would hold the whole workbook in the tab's memory before saving it,
          and would also break in the published-artifact sandbox where script-driven downloads
          are inert.

          Downloads an .xlsx. No `download` attribute filename here on purpose: the server's
          Content-Disposition names the file with the export's date, and a hardcoded name here
          would override it with a stale one.
        */}
        <Button variant="outline" asChild>
          <a href="/api/transactions/export" download>
            <Download data-icon="inline-start" />
            Export to Excel
          </a>
        </Button>
      </div>
    </div>
  );
}

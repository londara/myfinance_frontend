import type { Metadata } from "next";

import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { getCategories, getTransactions } from "@/lib/api/queries";

export const metadata: Metadata = { title: "Transactions" };

const PAGE_SIZE = 10;

/**
 * The ledger.
 *
 * <p><b>Filters live in the URL, not in component state.</b> `?search=coffee&page=2` re-renders
 * this Server Component with a new backend query, which means the filtered view is shareable,
 * bookmarkable, survives a refresh, and works with the back button. Holding the filters in
 * `useState` would have needed a client-side fetch layer and given up all four.
 *
 * <p>In Next 16 `searchParams` is a Promise and has to be awaited.
 */
export default async function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  const params = await searchParams;

  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const page = Number(first(params.page) ?? "0");
  const query = {
    from: first(params.from),
    to: first(params.to),
    categoryId: first(params.categoryId),
    search: first(params.search),
    page: Number.isFinite(page) && page >= 0 ? page : 0,
    size: PAGE_SIZE,
  };

  // Two independent reads, so they run concurrently rather than one after the other. Awaiting
  // them in sequence would make the page as slow as the sum instead of the slower one.
  const [transactions, categories] = await Promise.all([
    getTransactions(query),
    getCategories("EXPENSE"),
  ]);

  return (
    <div className="flex flex-col gap-stack-lg">
      <TransactionFilters categories={categories} />
      <TransactionsTable page={transactions} />
    </div>
  );
}

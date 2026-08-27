"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { LedgerAmount } from "@/components/shared/money";
import { StatusChip, statusTone } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteTransaction } from "@/lib/actions/finance";
import type { Page, Transaction } from "@/lib/api/types";
import { longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TransactionsTable({ page }: { page: Page<Transaction> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function goToPage(pageNumber: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(pageNumber));
    startTransition(() => router.push(`/transactions?${next}`, { scroll: false }));
  }

  async function onDelete(transaction: Transaction) {
    const result = await deleteTransaction(transaction.id);

    if (result.ok) {
      toast.success("Transaction deleted", { description: transaction.description });
      // The Server Action already called revalidatePath, but this component is showing a page of
      // data it received as a prop. refresh() re-runs the Server Component so the row disappears.
      router.refresh();
    } else {
      toast.error("Could not delete", { description: result.error });
    }
  }

  const firstShown = page.totalElements === 0 ? 0 : page.number * page.size + 1;
  const lastShown = page.number * page.size + page.numberOfElements;

  return (
    <div className="fin-card overflow-hidden" aria-busy={pending}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">
            Transactions matching the current filters
          </caption>
          <thead>
            <tr>
              <th scope="col" className="fin-th">Date</th>
              <th scope="col" className="fin-th">Description</th>
              <th scope="col" className="fin-th">Category</th>
              <th scope="col" className="fin-th">Method</th>
              <th scope="col" className="fin-th text-right">Amount</th>
              <th scope="col" className="fin-th text-center">Status</th>
              <th scope="col" className="fin-th w-12">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {page.content.map((transaction) => {
              const MethodIcon = transaction.method.startsWith("••••")
                ? CreditCard
                : Building2;

              return (
                <tr
                  key={transaction.id}
                  className="group border-b border-border transition-colors last:border-0 hover:bg-surface-low/60"
                >
                  <td className="fin-td tnum whitespace-nowrap text-on-surface-variant">
                    {longDate(transaction.date)}
                  </td>
                  <td className="fin-td font-medium text-on-surface">
                    {transaction.description}
                  </td>
                  <td className="fin-td text-on-surface-variant">
                    {transaction.category ?? "Uncategorised"}
                  </td>
                  <td className="fin-td">
                    <span className="flex items-center gap-2 text-on-surface-variant">
                      <MethodIcon className="size-4 shrink-0" aria-hidden />
                      {transaction.method}
                    </span>
                  </td>
                  <td className="fin-td text-right">
                    <LedgerAmount value={transaction.amount} />
                  </td>
                  <td className="fin-td text-center">
                    <StatusChip
                      label={transaction.status}
                      tone={statusTone(transaction.status)}
                    />
                  </td>
                  <td className="fin-td text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${transaction.description}`}
                          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => onDelete(transaction)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}

            {page.content.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center">
                  <p className="text-title-md text-on-surface">No transactions found</p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {page.totalElements === 0
                      ? "Use Add Transaction to record your first one."
                      : "Adjust the search or date range to widen your results."}
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="tnum text-body-md text-on-surface-variant">
          Showing {firstShown} to {lastShown} of {page.totalElements} entries
        </p>

        {page.totalPages > 1 ? (
          <nav aria-label="Pagination" className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={page.first || pending}
              onClick={() => goToPage(page.number - 1)}
            >
              <ChevronLeft />
            </Button>

            {Array.from({ length: page.totalPages }, (_, index) => index).map((number) => (
              <Button
                key={number}
                variant={number === page.number ? "default" : "ghost"}
                size="icon"
                aria-current={number === page.number ? "page" : undefined}
                disabled={pending}
                onClick={() => goToPage(number)}
                className={cn("tnum", number !== page.number && "text-on-surface")}
              >
                {number + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={page.last || pending}
              onClick={() => goToPage(page.number + 1)}
            >
              <ChevronRight />
            </Button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

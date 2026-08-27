import Link from "next/link";

import { LedgerAmount } from "@/components/shared/money";
import { SectionCard, SectionHeader } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/lib/api/types";
import { shortDate } from "@/lib/format";

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <SectionCard className="flex flex-col">
      <SectionHeader
        title="Recent Transactions"
        action={
          <Button variant="link" size="sm" asChild>
            <Link href="/transactions">View All</Link>
          </Button>
        }
      />

      {transactions.length === 0 ? (
        <p className="mt-6 text-body-md text-on-surface-variant">
          No transactions yet. Use Add Transaction to record one.
        </p>
      ) : (
        <div className="mt-4 -mx-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr>
                <th className="fin-th pl-6">Date</th>
                <th className="fin-th">Description</th>
                <th className="fin-th">Category</th>
                <th className="fin-th">Method</th>
                <th className="fin-th pr-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border last:border-0">
                  <td className="fin-td tnum pl-6 whitespace-nowrap text-on-surface-variant">
                    {shortDate(transaction.date)}
                  </td>
                  <td className="fin-td text-title-md text-brand">
                    {transaction.description}
                  </td>
                  <td className="fin-td text-on-surface-variant">
                    {transaction.category ?? "Uncategorised"}
                  </td>
                  <td className="fin-td text-on-surface-variant">{transaction.method}</td>
                  <td className="fin-td pr-6 text-right">
                    <LedgerAmount value={transaction.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

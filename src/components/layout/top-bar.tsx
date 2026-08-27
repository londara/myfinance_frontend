import { NotificationBell } from "@/components/notifications/notification-bell";
import { AccountMenu } from "@/components/layout/account-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeading } from "@/components/layout/page-heading";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AddTransactionDialog } from "@/components/modals/add-transaction-dialog";
import {
  getAccounts,
  getCategories,
  getMe,
  getNotifications,
} from "@/lib/api/queries";

/**
 * The top app bar. A Server Component, so the user, the notification count, and the accounts and
 * categories the Add Transaction dialog needs are all fetched here and passed down as props.
 *
 * <p>This is the one place worth noting a cost: it runs on every page in the group, so these four
 * reads happen on every navigation. They are small and the backend caches categories for an hour,
 * but if this ever shows up in a trace, the fix is to move it into the layout above a
 * `loading.tsx` boundary rather than to add a client-side cache here.
 */
export async function TopBar() {
  const [me, notifications, accounts, categories] = await Promise.all([
    getMe(),
    getNotifications(20),
    getAccounts(),
    getCategories(),
  ]);

  const active = accounts.filter((account) => account.active);

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-4 bg-background px-gutter py-stack-md md:pr-edge">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <PageHeading />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <AddTransactionDialog accounts={active} categories={categories} />

        <ThemeToggle />

        <NotificationBell
          initial={notifications.items}
          initialUnread={notifications.unread}
        />

        <AccountMenu
          name={`${me.firstName} ${me.lastName}`}
          email={me.email}
          initials={me.initials}
        />
      </div>
    </header>
  );
}

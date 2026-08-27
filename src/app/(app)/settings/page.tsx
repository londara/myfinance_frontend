import type { Metadata } from "next";
import { Landmark, ShieldCheck, User } from "lucide-react";

import { LinkedAccounts } from "@/components/settings/linked-accounts";
import { Money } from "@/components/shared/money";
import { SectionCard } from "@/components/shared/section-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { getAccounts, getMe } from "@/lib/api/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [me, accounts] = await Promise.all([getMe(), getAccounts()]);

  return (
    <div className="flex flex-col gap-gutter">
      {/* Profile */}
      <SectionCard>
        <h2 className="mb-6 flex items-center gap-2 text-title-lg text-brand">
          <User className="size-5" aria-hidden />
          Profile Information
        </h2>

        <div className="flex flex-wrap items-center gap-6">
          <Avatar className="size-20 border-2 border-surface-high">
            <AvatarFallback className="bg-brand-fixed text-headline-md font-semibold text-brand">
              {me.initials}
            </AvatarFallback>
          </Avatar>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="fin-label">First Name</dt>
              <dd className="mt-1 text-body-lg text-on-surface">{me.firstName}</dd>
            </div>
            <div>
              <dt className="fin-label">Last Name</dt>
              <dd className="mt-1 text-body-lg text-on-surface">{me.lastName}</dd>
            </div>
            <div>
              <dt className="fin-label">Email Address</dt>
              <dd className="mt-1 text-body-lg text-on-surface">{me.email}</dd>
            </div>
            <div>
              <dt className="fin-label">Base Currency</dt>
              <dd className="mt-1 text-body-lg text-on-surface">{me.baseCurrency}</dd>
            </div>
          </dl>
        </div>

        {/*
          First and Last are shown as two fields, matching how the backend stores them and how
          /register collects them. SCHEMA.md flagged the single "Full Name" field in the original
          design as an inconsistency to fix on this side — this is that fix.
        */}
        <p className="mt-6 text-label-md text-on-surface-variant">
          Editing your profile is read-only for now — the backend has no update endpoint yet.
        </p>
      </SectionCard>

      {/* Linked accounts */}
      <LinkedAccounts accounts={accounts} />

      {/* Notifications */}
      <SectionCard>
        <h2 className="mb-6 text-title-lg text-brand">Notifications</h2>

        <ul className="flex flex-col divide-y divide-border">
          {[
            {
              title: "Budget alerts",
              description: "Email me when a category reaches 80% of its limit.",
              checked: me.preferences.budgetAlerts,
            },
            {
              title: "Bill reminders",
              description: `Notify me ${me.preferences.reminderLeadDays} days before a payment is due.`,
              checked: me.preferences.billReminders,
            },
            {
              title: "Weekly digest",
              description: "A Monday summary of last week's activity.",
              checked: me.preferences.weeklyDigest,
            },
          ].map((setting) => (
            <li
              key={setting.title}
              className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-title-md text-on-surface">{setting.title}</p>
                <p className="mt-0.5 text-body-md text-on-surface-variant">
                  {setting.description}
                </p>
              </div>
              {/* Reflects the real stored preference. Disabled: there is no update endpoint yet,
                  and a toggle that silently does nothing is worse than one that says so. */}
              <Switch checked={setting.checked} disabled aria-label={setting.title} />
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Security */}
      <SectionCard>
        <h2 className="mb-6 flex items-center gap-2 text-title-lg text-brand">
          <ShieldCheck className="size-5" aria-hidden />
          Security
        </h2>

        <div className="flex items-start justify-between gap-6 rounded-lg border border-border p-4">
          <div className="min-w-0">
            <p className="text-title-md text-on-surface">Two-factor authentication</p>
            <p className="mt-0.5 text-body-md text-on-surface-variant">
              Require a one-time code when signing in from a new device.
            </p>
          </div>
          <Switch
            checked={me.twoFactorEnabled}
            disabled
            aria-label="Two-factor authentication"
          />
        </div>
      </SectionCard>

      {/* Total, so this screen answers "what am I worth" without a trip to the dashboard. */}
      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-title-md text-on-surface">
            <Landmark className="size-5 text-slate-ink" aria-hidden />
            Total across active accounts
          </span>
          <Money
            value={accounts
              .filter((account) => account.active)
              .reduce((sum, account) => sum + account.balance, 0)}
            className="text-title-lg text-brand"
          />
        </div>
      </SectionCard>
    </div>
  );
}

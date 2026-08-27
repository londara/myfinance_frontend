import {
  BarChart3,
  Bell,
  LayoutDashboard,
  Receipt,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Header title + subtitle, rendered by the top app bar */
  title: string;
  subtitle: string;
};

export const primaryNav: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    title: "Dashboard Overview",
    subtitle: "Your financial position at a glance",
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: Receipt,
    title: "Transactions",
    subtitle: "View and manage all your financial activity",
  },
  {
    href: "/budgets",
    label: "Budgets",
    icon: Wallet,
    title: "Budgets",
    subtitle: "Set limits and stay on track",
  },
  {
    href: "/goals",
    label: "Goals",
    icon: Target,
    title: "Financial Goals",
    subtitle: "Plan for what matters most",
  },
  {
    href: "/reminders",
    label: "Reminders",
    icon: Bell,
    title: "Reminders",
    subtitle: "Never miss a payment",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    title: "Financial Reports",
    subtitle: "Deep dive into your financial data",
  },
];

export const secondaryNav: NavItem[] = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    title: "Settings",
    subtitle: "Manage your profile and preferences",
  },
];

export function pageMetaFor(pathname: string): NavItem {
  const all = [...primaryNav, ...secondaryNav];
  const match = all
    .filter((item) => item.href !== "/" && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match ?? all[0];
}

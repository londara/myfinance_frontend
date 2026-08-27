"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { logout } from "@/lib/actions/auth";
import { primaryNav, secondaryNav, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-title-md transition-colors duration-200",
        active
          ? "translate-x-1 border-r-4 border-brand bg-surface-low font-bold text-brand"
          : "text-slate-ink hover:bg-surface-low hover:text-brand",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col px-gutter py-stack-lg">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-10 flex items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <span className="flex size-8 items-center justify-center rounded bg-brand text-sm font-bold text-background">
          M
        </span>
        <span className="flex flex-col">
          <span className="text-title-lg font-bold text-brand">MyFinance</span>
          <span className="text-label-md text-slate-ink">
            Wealth Management
          </span>
        </span>
      </Link>

      <nav aria-label="Primary" className="flex-1">
        <ul className="flex flex-col gap-2">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                active={isActive(pathname, item.href)}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        {secondaryNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-title-md text-slate-ink transition-colors duration-200 hover:bg-surface-low hover:text-brand"
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 z-50 hidden h-screen w-sidebar border-r border-border bg-card shadow-sm md:block">
      <SidebarNav />
    </aside>
  );
}

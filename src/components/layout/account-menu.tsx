"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth";

/**
 * The avatar menu. Sign out calls the Server Action, which revokes the session row on the backend
 * and clears the httpOnly cookie — a client-side cookie delete could not do either.
 */
export function AccountMenu({
  name,
  email,
  initials,
}: {
  name: string;
  email: string;
  initials: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-surface-high text-label-md font-semibold text-brand">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-body-md font-medium text-on-surface">{name}</span>
          <span className="text-label-md font-normal text-on-surface-variant">
            {email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={() => startTransition(() => void logout())}
        >
          <LogOut />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

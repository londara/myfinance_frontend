"use client";

import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/**
 * The icon reflects the theme in effect. It is swapped by the `dark:` variant
 * rather than by JS, so the server and client render the same markup and there
 * is no hydration guard or first-paint flash.
 */
function ThemeIcon() {
  return (
    <>
      <Sun className="size-5 dark:hidden" aria-hidden />
      <Moon className="hidden size-5 dark:block" aria-hidden />
    </>
  );
}

/** Light / Dark / System picker for the top app bar. */
export function ThemeToggle({ className }: { className?: string }) {
  // Safe to read directly: the menu body only mounts once it is opened.
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className={cn("rounded-full", className)}
              aria-label="Change theme"
            >
              <ThemeIcon />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Theme</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((option) => {
          const OptionIcon = option.icon;

          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => setTheme(option.value)}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <OptionIcon className="size-4" aria-hidden />
                {option.label}
              </span>
              {theme === option.value ? (
                <Check className="size-4" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Two-state flip for surfaces with no room for a menu (the auth pages).
 * `resolvedTheme` is read inside the handler, where it is always defined.
 */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon-lg"
      className={cn("rounded-full", className)}
      aria-label="Toggle light and dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <ThemeIcon />
    </Button>
  );
}

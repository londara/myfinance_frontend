"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllNotificationsRead } from "@/lib/actions/finance";
import type { Notification } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * The bell, fed by the backend's Server-Sent Events stream.
 *
 * <p>Initial state arrives as props from the Server Component, so the badge is correct on first
 * paint with no request from the browser. The stream then only carries *changes*.
 *
 * <p><b>Why an EventSource and not polling.</b> Polling every ten seconds is a request per user per
 * ten seconds to almost always learn "nothing new". The stream costs one connection and delivers
 * the moment something happens. The backend keeps it cheap on its side too — returning a `Flux`
 * releases the Tomcat worker thread, so an idle stream costs a socket, not a thread.
 *
 * <p>The connection goes to `/api/notifications/stream` on *this* origin, not to :8080 — see that
 * route handler for why (`EventSource` cannot send an Authorization header).
 */
export function NotificationBell({
  initial,
  initialUnread,
}: {
  initial: Notification[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [unread, setUnread] = useState(initialUnread);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("open", () => setLive(true));

    // The backend names the event "notification"; heartbeats are SSE comments and never surface
    // here at all, which is exactly why they make good keep-alives.
    source.addEventListener("notification", (event) => {
      try {
        const incoming = JSON.parse((event as MessageEvent).data) as Notification;

        setItems((current) => {
          // A reconnect can replay the last event, so guard against duplicates by id.
          if (current.some((item) => item.id === incoming.id)) {
            return current;
          }
          return [incoming, ...current].slice(0, 20);
        });

        setUnread((count) => count + 1);
        toast(incoming.title, { description: incoming.body });
      } catch {
        // A malformed frame should not take down the stream.
      }
    });

    source.addEventListener("error", () => {
      // EventSource reconnects on its own with a backoff, so there is nothing to do but reflect
      // the state. Calling close() here would disable that built-in recovery.
      setLive(false);
    });

    return () => source.close();
  }, []);

  async function onMarkAllRead() {
    const previous = { items, unread };

    // Optimistic: the badge clears immediately, and rolls back if the server disagrees.
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, unread: false })));

    const result = await markAllNotificationsRead();

    if (result.ok) {
      router.refresh();
    } else {
      setUnread(previous.unread);
      setItems(previous.items);
      toast.error("Could not mark them read", { description: result.error });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative rounded-full"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span className="absolute top-0.5 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-label-md font-normal",
              live ? "text-success" : "text-on-surface-variant",
            )}
          >
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full", live ? "bg-success" : "bg-outline")}
            />
            {live ? "Live" : "Reconnecting"}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-body-md text-on-surface-variant">
            Nothing yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="flex flex-col items-start gap-0.5 whitespace-normal"
              >
                <span className="flex w-full items-start gap-2">
                  {item.unread ? (
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-container"
                    />
                  ) : (
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0" />
                  )}
                  <span className="text-body-md font-medium text-on-surface">
                    {item.title}
                  </span>
                </span>
                {item.body ? (
                  <span className="pl-3.5 text-label-md text-on-surface-variant">
                    {item.body}
                  </span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {unread > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onMarkAllRead}>
              <CheckCheck />
              Mark all read
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

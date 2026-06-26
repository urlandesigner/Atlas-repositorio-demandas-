"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import { Bell } from "lucide-react"

import { useOptionalSession } from "@/hooks/use-optional-session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  formatNotificationTime,
  getNotificationsForUser,
  getNotificationsServerSnapshot,
  getNotificationsSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotificationsStore,
} from "@/lib/notifications/store"

function Dot({ className }: { className?: string }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  )
}

export function NotificationsPopover() {
  const session = useOptionalSession()

  const allNotifications = useSyncExternalStore(
    subscribeNotificationsStore,
    getNotificationsSnapshot,
    getNotificationsServerSnapshot
  )

  const notifications = useMemo(() => {
    if (!session?.userId) return []
    return getNotificationsForUser(session.userId)
  }, [allNotifications, session?.userId])

  const unreadCount = notifications.filter((entry) => !entry.read).length

  if (!session) return null

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Abrir notificações"
        render={
          <Button size="icon" variant="outline" className="relative">
            <Bell size={16} strokeWidth={2} aria-hidden="true" />
            {unreadCount > 0 ? (
              <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            ) : null}
          </Button>
        }
      />
      <PopoverContent className="w-80 p-1">
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Notificações</div>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-xs font-medium hover:underline"
              onClick={() => markAllNotificationsRead(session.userId)}
            >
              Marcar todas como lidas
            </button>
          ) : null}
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="-mx-1 my-1 h-px bg-border"
        />
        {notifications.length ? (
          notifications.slice(0, 8).map((notification) => (
            <div
              key={notification.id}
              className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <div className="relative flex items-start pe-3">
                <div className="flex-1 space-y-1">
                  {notification.href ? (
                    <Link
                      href={notification.href}
                      className="block text-foreground/80 after:absolute after:inset-0"
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <span className="font-medium text-foreground">{notification.title}</span>
                      <p className="text-xs text-muted-foreground">{notification.body}</p>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="text-left text-foreground/80 after:absolute after:inset-0"
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <span className="font-medium text-foreground">{notification.title}</span>
                      <p className="text-xs text-muted-foreground">{notification.body}</p>
                    </button>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatNotificationTime(notification.createdAt)}
                  </div>
                </div>
                {!notification.read ? (
                  <div className="absolute end-0 self-center">
                    <span className="sr-only">Não lida</span>
                    <Dot />
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma notificação no momento.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}

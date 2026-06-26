"use client"

import { NotificationsPopover } from "@/components/ui/notifications-popover"

export function WorkspaceTopBar() {
  return (
    <div className="flex items-center justify-end border-b border-border/60 px-6 py-3">
      <NotificationsPopover />
    </div>
  )
}

import { NotificationsPopover } from "@/components/ui/notifications-popover"

export function PageHeaderActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-4">
      <NotificationsPopover />
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

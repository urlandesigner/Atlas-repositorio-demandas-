import { AppHeader } from "@/components/shell/app-header"
import { NotificationsPopover } from "@/components/ui/notifications-popover"
import { SidebarInset } from "@/components/ui/sidebar"

export function AppShellContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="group/shell">
      <AppHeader />
      {/* Sino flutuante no canto superior direito (desktop). Some quando a
          página renderiza um PageHeaderActions — lá o sino aparece ao lado
          do CTA primário, sempre como último item à direita. */}
      <div className="absolute top-4 right-4 z-40 hidden md:top-6 md:right-6 md:block group-has-[[data-page-actions]]/shell:md:hidden">
        <NotificationsPopover />
      </div>
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </SidebarInset>
  )
}

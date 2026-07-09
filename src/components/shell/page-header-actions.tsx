import { NotificationsPopover } from "@/components/ui/notifications-popover"

/**
 * Cluster de ações do topo da página, sempre alinhado à direita.
 * Inclui o sino de notificações como último item (desktop) — em páginas
 * sem CTA primário, o sino flutuante do shell cobre o mesmo lugar.
 */
export function PageHeaderActions({ children }: { children?: React.ReactNode }) {
  return (
    <div data-page-actions className="flex shrink-0 flex-wrap items-center gap-2">
      {children}
      <div className="hidden md:block">
        <NotificationsPopover />
      </div>
    </div>
  )
}

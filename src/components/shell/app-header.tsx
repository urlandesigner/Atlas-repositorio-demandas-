"use client"

import { Menu } from "lucide-react"

import { shellHeaderClassName } from "@/components/shell/shell-header-styles"
import { Button } from "@/components/ui/button"
import { NotificationsPopover } from "@/components/ui/notifications-popover"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"

export function AppHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-background px-4 md:px-6",
        shellHeaderClassName
      )}
    >
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand shadow-[0_8px_20px_color-mix(in_srgb,var(--color-brand)_24%,transparent)]">
          <span className="text-sm font-bold tracking-tight text-brand-foreground">A</span>
        </div>
        <span className="text-base font-semibold tracking-tight">Atlas</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 rounded-xl md:hidden"
          onClick={toggleSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
        <NotificationsPopover />
      </div>
    </header>
  )
}

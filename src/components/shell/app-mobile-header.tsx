"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function AppMobileHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background px-4 py-3 md:hidden">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand shadow-[0_8px_20px_color-mix(in_srgb,var(--color-brand)_24%,transparent)]">
          <span className="text-sm font-bold tracking-tight text-brand-foreground">A</span>
        </div>
        <span className="text-base font-semibold tracking-tight">Atlas</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 rounded-xl"
        onClick={toggleSidebar}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </Button>
    </header>
  )
}

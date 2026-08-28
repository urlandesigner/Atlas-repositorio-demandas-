"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card de opção selecionável (single ou multi-select) para formulários —
 * escolha de nível de rubrica, tipo de colaborador, perfil DISC etc.
 */
function OptionCard({
  className,
  active = false,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-slot="option-card"
      className={cn(
        "w-full rounded-xl border px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50",
        active
          ? "border-brand/40 bg-brand-muted/50"
          : "border-border hover:bg-muted/40",
        className
      )}
      {...props}
    />
  )
}

export { OptionCard }

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Linha de lista clicável — abre um registro/detalhe em drawer ou sheet. */
function ListRowButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="list-row-button"
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20",
        className
      )}
      {...props}
    />
  )
}

export { ListRowButton }

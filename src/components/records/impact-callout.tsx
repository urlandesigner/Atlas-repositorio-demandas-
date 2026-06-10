import type { ReactNode } from "react"
import { TrendingUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type ImpactCalloutSize = "default" | "sm"
type ImpactCalloutLines = 1 | 2 | 3

const SIZE_CLASS: Record<ImpactCalloutSize, { container: string; text: string }> = {
  default: { container: "rounded-[18px] px-4 py-3", text: "text-[15px] leading-6" },
  sm: { container: "rounded-[14px] px-3 py-2.5", text: "text-[13px] leading-5" },
}

const LINE_CLAMP: Record<ImpactCalloutLines, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
}

/**
 * Caixa cinza padronizada de "Impacto gerado" usada nos cards de entrega.
 * Centraliza o estilo para manter a leitura consistente em toda a aplicação.
 */
export function ImpactCallout({
  children,
  size = "default",
  lines = 2,
  label = "Impacto gerado",
  className,
}: {
  children: ReactNode
  size?: ImpactCalloutSize
  lines?: ImpactCalloutLines
  label?: string
  className?: string
}) {
  const sizeClass = SIZE_CLASS[size]

  return (
    <div
      className={cn(
        "border border-brand/15 bg-brand-muted shadow-[0_6px_16px_oklch(0.6_0.12_162/0.08),inset_0_1px_0_rgba(255,255,255,0.45)]",
        sizeClass.container,
        className
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted-foreground">
        <TrendingUpIcon className="size-3.5" />
        {label}
      </div>
      <p className={cn("mt-1.5 font-medium text-foreground", sizeClass.text, LINE_CLAMP[lines])}>
        {children}
      </p>
    </div>
  )
}

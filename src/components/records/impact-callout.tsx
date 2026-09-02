import type { ReactNode } from "react"
import { TrendingUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Overline } from "@/components/ui/overline"

type ImpactCalloutSize = "default" | "sm"
type ImpactCalloutLines = 1 | 2 | 3

const SIZE_CLASS: Record<ImpactCalloutSize, { container: string; text: string }> = {
  default: { container: "rounded-lg px-4 py-3", text: "text-md leading-6" },
  sm: { container: "rounded-lg px-3 py-2.5", text: "text-xs leading-5" },
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
        "border border-brand/15 bg-brand-muted shadow-card",
        sizeClass.container,
        className
      )}
    >
      <Overline size="sm" className="flex items-center gap-2 text-brand-muted-foreground">
        <TrendingUpIcon className="size-3.5" />
        {label}
      </Overline>
      <p className={cn("mt-1.5 font-medium text-foreground", sizeClass.text, LINE_CLAMP[lines])}>
        {children}
      </p>
    </div>
  )
}

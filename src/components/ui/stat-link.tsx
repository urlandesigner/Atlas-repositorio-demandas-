import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Número clicável: rótulo de instrumento + número + apoio, e a seta que aparece
 * no hover diz que leva a algum lugar.
 *
 * Diferente do MetricCard, não tem superfície própria. Ele mora dentro de uma
 * superfície que já existe (o destaque de marca do Início, a faixa de números
 * do Admin) e quem chama decide padding e cor de hover pelo `className`, porque
 * o passo de claridade certo depende do fundo de trás.
 */
export function StatLink({
  href,
  label,
  value,
  helper,
  labelClassName,
  className,
}: {
  href: string
  label: string
  value: React.ReactNode
  helper?: React.ReactNode
  labelClassName?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/stat block outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/30",
        className
      )}
    >
      <span className={cn("label-mono text-muted-foreground", labelClassName)}>{label}</span>
      <span className="mt-2 flex items-center gap-1.5">
        <span className="figure text-[32px]! text-foreground">{value}</span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-3.5 text-muted-foreground opacity-0 transition-[opacity,translate] duration-150 group-hover/stat:-translate-y-0.5 group-hover/stat:translate-x-0.5 group-hover/stat:opacity-100 group-focus-visible/stat:opacity-100 motion-reduce:transition-none"
        />
      </span>
      {helper ? <span className="mt-1 block text-xs text-muted-foreground">{helper}</span> : null}
    </Link>
  )
}

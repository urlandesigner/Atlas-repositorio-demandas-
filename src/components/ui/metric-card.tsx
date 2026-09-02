import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Card de métrica: micro-label uppercase + número grande + texto de apoio.
 * variant="tile": bloco leve (padrão dos hubs admin/gestão).
 * variant="card": com ícone no topo-direita, para grids de destaque.
 * Com href o card inteiro vira link.
 */
export function MetricCard({
  label,
  value,
  helper,
  suffix,
  icon: Icon,
  href,
  variant = "tile",
  className,
  ...props
}: {
  label: string
  value: React.ReactNode
  helper?: React.ReactNode
  suffix?: string
  icon?: LucideIcon
  href?: string
  variant?: "tile" | "card"
} & React.ComponentProps<"div">) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="label-mono text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
      </div>
      <p className="figure mt-2.5 text-[28px]! text-foreground">
        {value}
        {suffix ? (
          <span className="ml-0.5 text-sm font-medium text-muted-foreground">{suffix}</span>
        ) : null}
      </p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </>
  )

  const rootClassName = cn(
    variant === "card"
      ? "rounded-lg border border-border bg-card px-4 py-4"
      : "rounded-xl border border-border/70 bg-card/65 px-4 py-3",
    href && "block transition-colors hover:border-foreground/15 hover:bg-card",
    className
  )

  if (href) {
    return (
      <Link href={href} className={rootClassName}>
        {body}
      </Link>
    )
  }

  return (
    <div className={rootClassName} {...props}>
      {body}
    </div>
  )
}

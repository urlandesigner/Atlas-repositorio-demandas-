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
      // Nível de página, ao lado de Cards de verdade: tem de ser o MESMO
      // tratamento, senão a fileira mistura duas linguagens — era o caso dos
      // dois KPIs da Início ao lado da Trilha. Sem borda, bg-card cheio, raio
      // de cartão e 24px, exatamente como components/ui/card.tsx.
      ? "rounded-xl bg-card p-6"
      // O `tile` continua com borda, e isso é uma pendência declarada, não
      // esquecimento: ele é usado nos dois níveis — solto na página (hubs de
      // gestão e admin) e aninhado dentro de cartões brancos
      // (career-context-bar, impact-summary). Nenhum preenchimento serve aos
      // dois: --muted (#F3F4F6) é quase o fundo da página (#F5F5F5) e
      // desapareceria solto; bg-card desapareceria aninhado. Só o raio foi
      // corrigido — estava em rounded-xl, o raio de CARTÃO, enquanto o variant
      // "card" estava em rounded-lg: os dois estavam trocados de papel.
      : "rounded-lg border border-border/70 bg-card/65 px-4 py-3",
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

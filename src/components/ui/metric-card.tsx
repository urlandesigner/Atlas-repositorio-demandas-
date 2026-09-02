import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Card de métrica: micro-label uppercase + número grande + texto de apoio.
 * Com href o card inteiro vira link.
 *
 * ## As três variantes existem por causa do FUNDO, não do tamanho
 *
 * Sem borda, uma superfície só se separa pelo passo de claridade contra o que
 * está atrás — e o que está atrás depende de onde o card é usado. Um único
 * preenchimento não serve aos dois níveis, e isso foi medido, não suposto:
 * o `tile` antigo (bg-card/65 + borda) dava ΔL* 3,6 solto na página do perfil
 * e ΔL* -0,1 aninhado no painel de promoção. Aninhado ele era invisível: só
 * existia por causa da borda de 1px.
 *
 * variant="card"  nível de página, com ícone. É o MESMO tratamento de
 *                 components/ui/card.tsx — bg-card, 22px, 24px de padding, sem
 *                 borda — porque ele fica lado a lado com Cards de verdade e
 *                 qualquer diferença mistura duas linguagens na mesma fileira.
 * variant="tile"  nível de página, compacto (hubs de gestão e admin, resumos).
 *                 bg-card cheio: ΔL* 6,6 no escuro e 3,5 no claro contra o chão.
 * variant="inset" aninhado DENTRO de um cartão. bg-muted: ΔL* 6,2 no escuro e
 *                 3,8 no claro contra o cartão. Use esta quando o card estiver
 *                 dentro de um Card, CardListBody ou qualquer painel bg-card.
 *
 * `tile` e `inset` ficam em 20px de padding, não 24. É passo deliberado: são
 * caixas de métrica compactas, às vezes cinco na mesma fileira, e é o mesmo
 * padding que o clone usa nos painéis internos.
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
  variant?: "tile" | "card" | "inset"
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

  const SUPERFICIE = {
    card: "rounded-xl bg-card p-6",
    tile: "rounded-lg bg-card p-5",
    inset: "rounded-lg bg-muted p-5",
  } as const

  const HOVER = {
    card: "hover:bg-card-hover",
    tile: "hover:bg-card-hover",
    inset: "hover:bg-muted-hover",
  } as const

  const rootClassName = cn(
    SUPERFICIE[variant],
    href && cn("block transition-colors", HOVER[variant]),
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

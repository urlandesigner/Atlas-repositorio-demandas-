import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Card sem padding/gap externos — cabeçalho e lista ficam colados à borda. */
export function CardList({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return <Card className={cn("gap-0 py-0", className)} {...props} />
}

/** Cabeçalho para cards cujo conteúdo principal é uma lista — título acima do peso das linhas. */
export function CardListHeader({
  title,
  description,
  action,
  className,
  ...props
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
} & React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("border-b border-border/60 px-4 pt-4 pb-3.5", className)}
      {...props}
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
    </CardHeader>
  )
}

export function CardListBody({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return <CardContent className={cn("p-0", className)} {...props} />
}

export function CardListRows({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("divide-y divide-border/60", className)} {...props} />
}

export function CardListRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
      {...props}
    />
  )
}

/**
 * Linha canônica de lista: **badge, título, texto, data** — nessa ordem, sempre
 * empilhados.
 *
 * Existe porque as quatro listas da Início (Avisos do RH, Foco do ciclo,
 * Elogios de colegas, Últimas movimentações) tinham inventado cada uma a sua
 * própria ordem: umas com badge à direita do título, outras abaixo, e a data
 * numa coluna à direita cuja largura cada lista escolhia sozinha — então as
 * fileiras não se alinhavam entre cards vizinhos.
 *
 * O badge vem primeiro porque é o que classifica a linha antes da leitura. A
 * data fecha, no mesmo eixo do resto. `action` fica entre texto e data: é a
 * saída da linha, não um metadado dela.
 *
 * A tipografia é do componente, não de quem chama — foi a liberdade de escolher
 * `line-clamp` e peso caso a caso que produziu a divergência original.
 */
export function CardListItem({
  badges,
  title,
  text,
  date,
  icon,
  action,
  className,
  ...props
}: {
  badges?: ReactNode
  title: ReactNode
  text?: ReactNode
  date?: ReactNode
  /** Ícone, avatar ou bolha à esquerda, alinhado à faixa de badges. */
  icon?: ReactNode
  /** CTA da linha (link, botão). */
  action?: ReactNode
} & Omit<React.ComponentProps<"div">, "title">) {
  return (
    <div className={cn("flex gap-3 px-4 py-3.5", className)} {...props}>
      {icon ? <div className="shrink-0">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        {badges ? (
          <div className="flex flex-wrap items-center gap-1.5">{badges}</div>
        ) : null}
        <CardListRowTitle className={cn("line-clamp-2", badges && "mt-1.5")}>
          {title}
        </CardListRowTitle>
        {text ? <CardListRowMeta className="line-clamp-2">{text}</CardListRowMeta> : null}
        {action ? <div className="mt-2.5">{action}</div> : null}
        {date ? (
          <p className="mt-2 text-xs leading-none text-muted-foreground">{date}</p>
        ) : null}
      </div>
    </div>
  )
}

/** Título de linha — menor e mais leve que o título do card. */
export function CardListRowTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm font-medium leading-snug text-foreground/90", className)}
      {...props}
    />
  )
}

export function CardListRowMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-1 text-xs leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

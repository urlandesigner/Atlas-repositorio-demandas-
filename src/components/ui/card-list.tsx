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
      {/* `min-h-9` é a altura de um Button size="sm" (36px). Sem isso o header
          media 55px quando a ação era um badge de contagem e 69px quando era um
          botão — então cards vizinhos começavam a lista em Y diferentes, e três
          deles lado a lado na Início liam como desalinhados. Com a faixa fixa,
          badge e botão se centralizam no mesmo espaço e o corpo sempre começa
          na mesma linha. */}
      <div
        className={cn(
          "flex w-full justify-between gap-4",
          description ? "items-start" : "min-h-9 items-center"
        )}
      >
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
          ) : null}
        </div>
        {action ? (
          <div className="flex h-9 shrink-0 items-center">{action}</div>
        ) : null}
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
    <div className={cn("px-4 py-3.5", className)} {...props}>
      {/* O ícone vive na faixa de badges, não numa coluna à esquerda. Como
          coluna, ele empurrava título, texto e data 44px para dentro — e numa
          fileira de três cards onde só um tem ícone, era o suficiente para o
          conjunto parecer torto. Inline, ele é o que também é: um
          classificador, ao lado do badge. */}
      {icon || badges ? (
        <div className="flex min-h-6 flex-wrap items-center gap-2">
          {icon}
          {badges}
        </div>
      ) : null}
      <CardListRowTitle className={cn("line-clamp-2", (icon || badges) && "mt-2")}>
        {title}
      </CardListRowTitle>
      {text ? (
        <CardListRowMeta className="line-clamp-2 leading-snug">{text}</CardListRowMeta>
      ) : null}
      {action ? <div className="mt-2.5">{action}</div> : null}
      {/* Data em mono tabular: é o último item de toda linha, em toda lista, e
          em tabular os dígitos ocupam a mesma largura — então a coluna fecha
          reta em vez de dançar conforme o número. */}
      {date ? (
        <p className="mt-2.5 font-mono text-2xs leading-none font-medium tracking-[0.08em] uppercase tabular-nums text-muted-foreground">
          {date}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Título de linha — menor que o título do card, mas o ponto de entrada da linha.
 *
 * Estava em 14px/500 com opacidade 90%, contra um badge de 13px/500 em cor
 * cheia. Um pixel e nenhum peso de diferença: o badge, que vem primeiro na
 * pilha, disputava o olho com o título e a linha ficava sem hierarquia. 15px/600
 * em cor cheia dá o degrau que faltava, contra os 13px/400 do corpo.
 */
export function CardListRowTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-md font-semibold leading-snug text-foreground", className)}
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

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
  icon,
  className,
  ...props
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /**
   * Ícone que classifica o card, à ESQUERDA do título.
   *
   * Existe porque cinco cards passavam o ícone em `action`, e `action` é a
   * coluna da direita — a mesma onde os cards vizinhos põem "Ver todos ↗" e
   * botões. Numa fileira, uns tinham ali algo clicável e outros um desenho
   * inerte, no mesmo lugar e no mesmo tamanho.
   *
   * O tratamento é do componente e não de quem chama: sem isso, cada card
   * escolhia o próprio tamanho e a própria cor, e a fileira voltava a divergir.
   * Passe o ícone sem classes.
   */
  icon?: ReactNode
} & React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("px-6 pt-6 pb-4", className)}
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
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            {icon ? (
              <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
                {icon}
              </span>
            ) : null}
            {title}
          </CardTitle>
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

/**
 * A pilha de linhas de um CardList, com o divisor recuado até a largura do
 * conteúdo.
 *
 * Era `divide-y`, que desenha a borda na linha inteira e portanto sangra de
 * ponta a ponta do cartão, enquanto o texto começa 24px adentro. O traço
 * atravessando mais que o conteúdo faz o cartão parecer uma tabela em vez de
 * uma lista.
 *
 * Aqui o divisor é um pseudo-elemento com `inset-x-6`, o mesmo recuo do
 * `px-6` das linhas: ele começa e termina onde o conteúdo começa e termina. E
 * fica só entre linhas (`*+*`), nunca antes da primeira nem depois da última.
 */
export function CardListRows({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "[&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:inset-x-6 [&>*+*]:before:top-0 [&>*+*]:before:h-px [&>*+*]:before:bg-border/60 [&>*+*]:before:content-['']",
        className
      )}
      {...props}
    />
  )
}

/**
 * Linha de fechamento de um CardList, presa ao fundo do cartão.
 *
 * Existe por causa da sobra: numa fileira de cartões de altura igual, quem tem
 * menos itens fica com o resto em branco — na Início, "Foco do ciclo" usava
 * 182px de um cartão de 367px, metade de ar.
 *
 * A alternativa era desigualar as alturas. Esta é a outra: a sobra passa a
 * dizer por que é sobra. O ganho não é estético — um cartão curto ao lado de um
 * cheio deixa a dúvida de se algo não carregou, e a nota responde isso.
 *
 * `mt-auto` prende no fundo, então ela só usa a sobra quando existe sobra; sem
 * ela, encosta nas linhas. Use apenas quando NADA está oculto — se houver mais
 * itens do que cabe, o que a linha tem a dizer é outro: quantos ficaram de
 * fora.
 */
export function CardListNote({
  action,
  className,
  children,
  ...props
}: {
  /** Ação que a nota oferece, quando existe uma. Fica à direita, na mesma linha. */
  action?: ReactNode
} & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 pt-3 pb-5",
        className
      )}
      {...props}
    >
      <p className="min-w-0 text-xs text-muted-foreground">{children}</p>
      {action}
    </div>
  )
}

export function CardListRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between",
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
    <div className={cn("px-6 py-4", className)} {...props}>
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
export function CardListRowTitle({
  className,
  as: Tag = "p",
  ...props
}: React.ComponentProps<"p"> & {
  /**
   * A tag renderizada. O padrão é `p`, para linha de lista dentro de um
   * CardList. Use `h3` quando o item for um cartão próprio numa coleção —
   * cartão de objetivo, de projeto, de apresentação — para o documento ter
   * hierarquia. O tratamento visual é o mesmo nos dois casos, e é esse o ponto:
   * o papel é "título de item", não "título de lista".
   */
  as?: "p" | "h2" | "h3" | "h4"
}) {
  return (
    <Tag
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

import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react"

import { StatLink } from "@/components/ui/stat-link"
import { cn } from "@/lib/utils"

/**
 * Faixa de números: uma superfície só, com divisórias, no lugar de uma
 * fileira de MetricCards soltos.
 *
 * ## Por que existe
 *
 * Doze telas abriam com 3 a 5 caixas de número lado a lado, cada uma com fundo,
 * raio e padding próprios. Juntas, eram cinco "assuntos" do mesmo peso antes
 * do conteúdo de verdade. Numa faixa os números leem como um instrumento só,
 * e a tela começa a hierarquia pelo que importa.
 *
 * `gap-px` sobre o fundo da borda desenha as divisórias em qualquer quebra de
 * linha. Com quantidade ímpar no celular, o primeiro ocupa a linha inteira para
 * não deixar uma célula vazia (que apareceria pintada com a cor da divisória).
 *
 * `inset` é para quando a faixa mora DENTRO de um card: as células passam a
 * bg-muted, o mesmo passo de claridade do MetricCard inset.
 */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-5",
}

/** Abre fragmentos: `{cond ? <><Stat/><Stat/></> : null}` conta como dois números. */
function flatten(children: ReactNode): ReactElement[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return []
    if (child.type === Fragment) {
      return flatten((child.props as { children?: ReactNode }).children)
    }
    return [child]
  })
}

export function StatStrip({
  children,
  inset = false,
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode
  inset?: boolean
  className?: string
  "aria-label"?: string
}) {
  const items = flatten(children)
  const count = items.length
  const oddOnMobile = count === 5

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "grid gap-px overflow-hidden rounded-xl bg-border/60",
        COLUMNS[count] ?? "grid-cols-2 lg:grid-cols-4",
        inset && "rounded-lg",
        className
      )}
    >
      {/* Chave pela posição: a ordem dos números é fixa, e as chaves que o
          React dá aos filhos de um fragmento (".0", ".1") colidiriam com as de
          fora depois do flatten. */}
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            inset ? "bg-muted" : "bg-card",
            oddOnMobile && index === 0 && "col-span-2 md:col-span-1"
          )}
        >
          {item}
        </div>
      ))}
    </section>
  )
}

/**
 * Um número da faixa. Com `href` vira StatLink (seta no hover, fundo que acende);
 * sem, é leitura pura.
 */
export function Stat({
  label,
  value,
  helper,
  suffix,
  href,
  inset = false,
}: {
  label: string
  value: React.ReactNode
  helper?: React.ReactNode
  suffix?: string
  href?: string
  inset?: boolean
}) {
  const shown = suffix ? (
    <>
      {value}
      <span className="ml-0.5 text-sm font-medium text-muted-foreground">{suffix}</span>
    </>
  ) : (
    value
  )

  if (href) {
    return (
      <StatLink
        href={href}
        label={label}
        value={shown}
        helper={helper}
        className={cn("h-full p-5", inset ? "hover:bg-muted-hover" : "hover:bg-card-hover")}
      />
    )
  }

  return (
    <div className="h-full p-5">
      <span className="label-mono text-muted-foreground">{label}</span>
      <p className="figure mt-2 text-[32px]! text-foreground">{shown}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

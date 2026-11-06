import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"

import { PersonAvatar } from "@/components/ui/person-avatar"
import { cn } from "@/lib/utils"

/**
 * Superfície de marca: o bloco que abre as telas-casa de cada papel (Início do
 * colaborador, Visão geral do gestor e do admin). Uma por tela, sempre no topo,
 * sempre com o que pede atenção primeiro.
 *
 * O brilho no canto dá profundidade sem textura nem gradiente de fundo
 * inteiro, e usa só o token --brand com opacidade.
 */
export function BrandSurface({
  labelledBy,
  className,
  children,
}: {
  labelledBy: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn("relative isolate overflow-hidden rounded-xl bg-brand-muted", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-brand/15 blur-3xl"
      />
      {children}
    </section>
  )
}

/**
 * Título do destaque: rótulo de instrumento + uma frase que resume o que pede
 * atenção. Cada parte de `parts` ganha a própria linha no celular, para o
 * título não quebrar com o separador no meio da frase.
 */
export function BrandSurfaceHeading({
  id,
  label,
  parts,
  empty,
}: {
  id: string
  label: string
  parts: string[]
  empty: string
}) {
  return (
    <div className="px-6 pt-6 lg:px-8 lg:pt-8">
      <span className="label-mono text-brand-muted-foreground">{label}</span>
      <h2
        id={id}
        className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        {parts.length
          ? parts.map((part, index) => (
              <span key={part} className="block sm:inline">
                {index > 0 ? (
                  <>
                    <span className="sr-only">, </span>
                    <span aria-hidden="true" className="hidden text-brand-muted-foreground sm:inline">
                      {" · "}
                    </span>
                  </>
                ) : null}
                {part}
              </span>
            ))
          : empty}
      </h2>
    </div>
  )
}

/** Coluna do destaque: título com contagem, até quatro linhas e o caminho para a lista inteira. */
export function AttentionColumn({
  title,
  count,
  footerHref,
  footerLabel,
  emptyText,
  children,
}: {
  title: string
  count: number
  footerHref: string
  footerLabel: string
  emptyText: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="label-mono text-brand-muted-foreground">{count}</span>
      </div>
      {count ? (
        <div className="flex flex-col gap-2">{children}</div>
      ) : (
        <p className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-3.5 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-success-foreground" aria-hidden="true" />
          {emptyText}
        </p>
      )}
      <Link
        href={footerHref}
        className="group/more mt-1 inline-flex w-fit items-center gap-1 rounded-sm text-sm font-medium text-accent-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {footerLabel}
        <ArrowRight
          aria-hidden="true"
          className="size-3.5 transition-transform duration-150 group-hover/more:translate-x-0.5 motion-reduce:transition-none"
        />
      </Link>
    </div>
  )
}

/** Linha clicável de uma AttentionColumn: pessoa, contexto e um selo opcional à direita. */
export function AttentionRow({
  href,
  name,
  avatarUrl,
  meta,
  trailing,
}: {
  href: string
  name: string
  avatarUrl?: string | null
  meta: string
  trailing?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg bg-card/60 px-4 py-3 outline-none hover-lift hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar name={name} imageUrl={avatarUrl ?? undefined} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      {trailing}
    </Link>
  )
}

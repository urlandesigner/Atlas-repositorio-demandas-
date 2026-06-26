"use client"

import { ArrowUpRight } from "lucide-react"

import { ATUACOES } from "@/components/records/atuacao-picker"
import { SCOPES } from "@/components/records/impact-selector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { HighlightFeedItem } from "@/lib/evolution/types"

const IMPACT_LABELS: Record<number, string> = {
  1: "Baixo",
  2: "Médio",
  3: "Alto",
  4: "Estratégico",
  5: "Transformacional",
}

export function HighlightCard({
  item,
  onOpen,
}: {
  item: HighlightFeedItem
  onOpen: () => void
}) {
  const atuacao = ATUACOES.find((a) => a.value === item.atuacao)?.label ?? item.atuacao
  const scope = SCOPES.find((s) => s.value === item.impactScope)?.label ?? item.impactScope

  return (
    <article className="rounded-2xl border border-border/60 bg-card/[0.98] p-4 transition-all duration-200 hover:border-foreground/12 hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {item.projectName ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {item.projectName}
          </span>
        ) : null}
        {item.highlights[0] ? (
          <Badge variant="outline" className="text-[10px] font-normal">
            {item.highlights[0]}
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-2 text-base font-semibold tracking-tight">{item.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {item.executiveSummary}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="font-normal">
          {atuacao}
        </Badge>
        <Badge variant="outline" className="font-normal">
          {IMPACT_LABELS[item.impactLevel]}
        </Badge>
        <Badge variant="outline" className="font-normal">
          {scope}
        </Badge>
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onOpen}>
          Abrir registro
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    </article>
  )
}

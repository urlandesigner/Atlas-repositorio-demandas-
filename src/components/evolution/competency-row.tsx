"use client"

import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CompetencyEvidenceView } from "@/lib/evolution/types"
import { EVIDENCE_STATUS_LABEL } from "@/lib/evolution/types"
import { cn } from "@/lib/utils"

const STATUS_STYLE = {
  forte: "border-brand/25 bg-brand-muted/40 text-brand-muted-foreground",
  em_evolucao: "border-border bg-muted/40 text-foreground/80",
  pouco_evidenciado: "border-dashed border-border/80 bg-muted/20 text-muted-foreground",
} as const

export function CompetencyRow({
  view,
  onOpenEvidence,
  onCreateObjective,
}: {
  view: CompetencyEvidenceView
  onOpenEvidence: () => void
  onCreateObjective?: () => void
}) {
  const progress = Math.min(100, Math.round((view.perceivedLevel / Math.max(view.expectedLevel, 1)) * 100))

  return (
    <article
      className={cn(
        "rounded-[12px] border p-4 transition-colors",
        view.status === "forte" ? "border-border/60 bg-card/[0.98]" : "border-border bg-card/60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">{view.label}</h3>
            <Badge variant="outline" className={cn("font-normal", STATUS_STYLE[view.status])}>
              {EVIDENCE_STATUS_LABEL[view.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{view.description}</p>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 gap-1" onClick={onOpenEvidence}>
          {view.evidenceCount} evidências
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Nível percebido {view.perceivedLevel} · esperado {view.expectedLevel}
          </span>
          <span className="tabular-nums">{view.recentEvidenceCount} recentes (90d)</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand/55 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {view.suggestedNextSteps[0] ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/80">Próximo passo: </span>
          {view.suggestedNextSteps[0]}
        </p>
      ) : null}

      {view.status !== "forte" && onCreateObjective ? (
        <Button variant="outline" size="sm" className="mt-3" onClick={onCreateObjective}>
          Criar objetivo
        </Button>
      ) : null}
    </article>
  )
}

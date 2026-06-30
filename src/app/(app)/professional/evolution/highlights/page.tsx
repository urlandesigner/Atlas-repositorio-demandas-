"use client"

import { useMemo, useState } from "react"

import { CareerContextBar } from "@/components/evolution/career-context-bar"
import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { HighlightCard } from "@/components/evolution/highlight-card"
import { Button } from "@/components/ui/button"
import { computeHighlightFeed } from "@/lib/evolution/highlights"
import { HIGHLIGHT_PERIOD_LABEL, type HighlightPeriod } from "@/lib/evolution/types"
import { useEvolutionData } from "@/hooks/use-evolution-data"
import { cn } from "@/lib/utils"

const PERIODS: HighlightPeriod[] = ["7d", "30d", "90d", "cycle", "quarter", "year"]

export default function EvolutionHighlightsPage() {
  const { records, openDetail, openCapture, profile, readiness, currentLevel, pinnedIds } =
    useEvolutionData()
  const [period, setPeriod] = useState<HighlightPeriod>("30d")

  const feed = useMemo(
    () => computeHighlightFeed(records, period, pinnedIds),
    [records, period, pinnedIds]
  )

  return (
    <EvolutionShell
      title="Feed de destaques"
      description="Impactos do período sem precisar percorrer toda a trajetória."
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <CareerContextBar
          goal={profile.goal}
          ladder={profile.ladder}
          currentLevelId={profile.identity.levelId}
          currentLevelName={currentLevel?.name ?? ""}
          readiness={readiness}
        />

        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                period === p
                  ? "border-brand/30 bg-brand-muted/50 text-brand-muted-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {HIGHLIGHT_PERIOD_LABEL[p]}
            </button>
          ))}
        </div>

        {feed.length ? (
          <div className="flex flex-col gap-3">
            {feed.map((item) => (
              <HighlightCard
                key={item.recordId}
                item={item}
                onOpen={() => openDetail(item.record)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum destaque neste período. Registre entregas com impacto para alimentar o feed.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => openCapture()}>
              Novo registro
            </Button>
          </div>
        )}
      </div>
    </EvolutionShell>
  )
}

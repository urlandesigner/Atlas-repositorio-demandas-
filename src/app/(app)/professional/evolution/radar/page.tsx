"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

import { CareerContextBar } from "@/components/evolution/career-context-bar"
import { CompetencyRow } from "@/components/evolution/competency-row"
import { EvidenceSheet } from "@/components/evolution/evidence-sheet"
import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { EvolutionPanel } from "@/components/profile/evolution-panel"
import type { CompetencyEvidenceView } from "@/lib/evolution/types"
import { useEvolutionData } from "@/hooks/use-evolution-data"

export default function EvolutionRadarPage() {
  const router = useRouter()
  const {
    records,
    openDetail,
    profile,
    pdi,
    objectives,
    readiness,
    currentLevel,
    competencyViews,
    strongCount,
  } = useEvolutionData()

  const [selected, setSelected] = useState<CompetencyEvidenceView | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const openEvidence = useCallback((view: CompetencyEvidenceView) => {
    setSelected(view)
    setSheetOpen(true)
  }, [])

  return (
    <EvolutionShell
      title="Evolução Profissional"
      description="Reflexão sobre competências e evidências para o próximo nível de carreira."
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <CareerContextBar
          goal={profile.goal}
          ladder={profile.ladder}
          currentLevelId={profile.identity.levelId}
          currentLevelName={currentLevel?.name ?? ""}
          readiness={readiness}
          strongCompetencies={strongCount}
          totalCompetencies={competencyViews.length}
        />

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Radar de senioridade
            </h2>
            <span className="text-xs text-muted-foreground">
              {strongCount} de {competencyViews.length} bem evidenciadas
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {competencyViews.map((view) => (
              <CompetencyRow
                key={view.competencyId}
                view={view}
                onOpenEvidence={() => openEvidence(view)}
                onCreateObjective={
                  view.status !== "forte"
                    ? () => router.push("/professional/objectives")
                    : undefined
                }
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            Matrizes PDI
          </h2>
          <EvolutionPanel
            ladder={profile.ladder}
            currentLevelId={profile.identity.levelId}
            currentLevelName={currentLevel?.name ?? ""}
            assessment={pdi}
            objectives={objectives}
          />
        </section>
      </div>

      <EvidenceSheet
        view={selected}
        records={records}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onOpenRecord={(record) => {
          setSheetOpen(false)
          openDetail(record)
        }}
      />
    </EvolutionShell>
  )
}

"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"

import { CareerContextBar } from "@/components/evolution/career-context-bar"
import { CompetencyRow } from "@/components/evolution/competency-row"
import { EvidenceSheet } from "@/components/evolution/evidence-sheet"
import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { EvolutionPanel } from "@/components/profile/evolution-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      description="Competências e evidências para o próximo nível."
    >
      {/* Sem teto de largura: a coluna de conteúdo já é limitada pelo shell
          (888px em 1440), e travar em max-w-3xl deixava 120px vazios só nesta
          página. Resumo e Conhecimento nunca travaram, então as sete telas do
          Perfil discordavam da própria largura. */}
      <div className="flex flex-col gap-6">
        <CareerContextBar
          goal={profile.goal}
          ladder={profile.ladder}
          currentLevelId={profile.identity.levelId}
          currentLevelName={currentLevel?.name ?? ""}
          readiness={readiness}
          strongCompetencies={strongCount}
          totalCompetencies={competencyViews.length}
        />

        {/* As duas seções eram empilhadas, e a lista de competências tem uma
            fileira por competência com barra, próximo passo e CTA — o painel de
            PDI ficava embaixo de tudo, longe o bastante para ninguém saber que
            existia.

            `variant="line"` e não o segmentado padrão: a sub-navegação do Perfil
            já é uma faixa de pílulas no mobile, e um segundo grupo de pílulas
            logo abaixo faria os dois níveis parecerem o mesmo. Sublinhado lê
            como troca de seção dentro da página, que é o que isto é.

            Os títulos `Overline` das duas seções saíram: o rótulo da aba passou
            a ser o título, e manter os dois repetiria a mesma palavra duas
            vezes seguidas. */}
        <Tabs defaultValue="evidencia">
          <TabsList variant="line">
            <TabsTrigger value="evidencia">Competências por evidência</TabsTrigger>
            <TabsTrigger value="pdi">Avanços PDI</TabsTrigger>
          </TabsList>

          <TabsContent value="evidencia">
            <div className="flex flex-col gap-3 pt-4">
              {/* A contagem vive DENTRO do painel, não ao lado das abas: ela
                  descreve esta lista, e ao lado das abas continuaria à vista
                  em "Avanços PDI", falando de um conteúdo que não está na
                  tela. */}
              <p className="text-xs text-muted-foreground">
                {strongCount} de {competencyViews.length} bem evidenciadas
              </p>
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
          </TabsContent>

          <TabsContent value="pdi">
            <div className="pt-4">
              <EvolutionPanel
                ladder={profile.ladder}
                currentLevelId={profile.identity.levelId}
                currentLevelName={currentLevel?.name ?? ""}
                assessment={pdi}
                objectives={objectives}
              />
            </div>
          </TabsContent>
        </Tabs>
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

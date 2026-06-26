"use client"

import { useCallback, useState, useSyncExternalStore } from "react"

import { CareerContextBar } from "@/components/evolution/career-context-bar"
import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { ReportEditor } from "@/components/evolution/report-editor"
import { Button } from "@/components/ui/button"
import { buildPromotionBaseline, createReportSnapshot } from "@/lib/evolution/reports"
import {
  getLatestReport,
  getReportsServerSnapshot,
  saveReport,
  subscribeReportsStore,
  updateReportSection,
} from "@/lib/evolution/reports-store"
import type { ReportSnapshot } from "@/lib/evolution/types"
import { useEvolutionData } from "@/hooks/use-evolution-data"

export default function EvolutionPromotionPage() {
  const {
    records,
    objectives,
    recognitions,
    presentations,
    profile,
    pdiBaseline,
    pdi,
    readiness,
    currentLevel,
    strongCount,
    competencyViews,
  } = useEvolutionData()

  const [report, setReport] = useState<ReportSnapshot | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [generating, setGenerating] = useState(false)

  const stored = useSyncExternalStore(
    subscribeReportsStore,
    () => getLatestReport("promotion"),
    () => getReportsServerSnapshot().find((r) => r.type === "promotion") ?? null
  )

  const activeReport = report ?? stored

  const generate = useCallback(
    async (withAi: boolean) => {
      setGenerating(true)
      const baseline = buildPromotionBaseline({
        records,
        objectives,
        recognitions,
        presentations,
        identity: profile.identity,
        goal: profile.goal,
        currentLevelName: currentLevel?.name ?? "",
        currentLevels: pdiBaseline,
        expectedLevels: pdi.expected,
        targetLevelId: profile.goal.targetLevelId,
      })
      let sections = baseline.sections
      if (withAi) {
        setRegenerating(true)
        try {
          const res = await fetch("/api/evolution/promotion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseline: { sections } }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.sections) sections = data.sections
          }
        } catch {
          /* mantém baseline */
        } finally {
          setRegenerating(false)
        }
      }
      const snapshot = createReportSnapshot({ ...baseline, sections })
      saveReport(snapshot)
      setReport(snapshot)
      setGenerating(false)
    },
    [
      records,
      objectives,
      recognitions,
      presentations,
      profile,
      pdiBaseline,
      pdi.expected,
      currentLevel?.name,
    ]
  )

  const handleUpdateSection = useCallback((sectionId: string, content: string) => {
    if (!activeReport) return
    const updated = updateReportSection(activeReport.id, sectionId, content)
    if (updated) setReport(updated)
  }, [activeReport])

  const handleRegenerate = useCallback(async () => {
    if (!activeReport) return
    setRegenerating(true)
    try {
      const res = await fetch("/api/evolution/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseline: { sections: activeReport.sections } }),
      })
      if (res.ok) {
        const data = await res.json()
        const updated: ReportSnapshot = {
          ...activeReport,
          lastEditedAt: new Date().toISOString(),
          sections: activeReport.sections.map((s) => {
            const match = data.sections?.find((x: { id: string }) => x.id === s.id)
            return match ? { ...s, content: match.content, source: "ai" as const } : s
          }),
        }
        saveReport(updated)
        setReport(updated)
      }
    } finally {
      setRegenerating(false)
    }
  }, [activeReport])

  return (
    <EvolutionShell
      title="Dossiê de evolução"
      description="Narrativa executiva baseada em evidências — seu material para conversas de progressão."
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

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => generate(false)} disabled={generating}>
            {generating ? "Gerando…" : "Gerar dossiê"}
          </Button>
          <Button variant="outline" onClick={() => generate(true)} disabled={generating}>
            Gerar e refinar com IA
          </Button>
        </div>

        {activeReport ? (
          <ReportEditor
            report={activeReport}
            onUpdateSection={handleUpdateSection}
            onRegenerate={handleRegenerate}
            regenerating={regenerating}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center text-sm text-muted-foreground">
            Consolide suas evidências em um material profissional para conversas de progressão.
          </div>
        )}
      </div>
    </EvolutionShell>
  )
}

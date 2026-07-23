"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { FileText, Sparkles } from "lucide-react"

import { ReportEditor } from "@/components/evolution/report-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getOneOnOneServerSnapshot,
  getOneOnOneSnapshot,
  subscribeOneOnOneStore,
} from "@/lib/evolution/one-on-one-store"
import { buildManagerOneOnOneBaseline } from "@/lib/gestao/manager-reports"
import { getObjectivesForUser } from "@/lib/gestao/objectives/store"
import {
  getActiveAssignmentForUser,
  getFrameworkById,
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import {
  getBehavioralProfile,
  getGestaoProfilesServerSnapshot,
  getGestaoProfilesSnapshot,
  getSoftSkillsRadar,
  subscribeGestaoProfilesStore,
} from "@/lib/gestao/profiles-store"
import {
  createGestaoReportSnapshot,
  getGestaoReportsServerSnapshot,
  getGestaoReportsSnapshot,
  getLatestGestaoReport,
  saveGestaoReport,
  subscribeGestaoReportsStore,
  updateGestaoReportSection,
  type GestaoReportSnapshot,
} from "@/lib/gestao/reports-store"
import type { OrgUser } from "@/lib/org/types"
import { loadRecords } from "@/lib/records/storage"

const PERIODS = [
  { id: "30", label: "Últimos 30 dias", days: 30 },
  { id: "60", label: "Últimos 60 dias", days: 60 },
  { id: "90", label: "Últimos 90 dias", days: 90 },
] as const

function formatEntryDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function LideradoOneOnOnePanel({
  collaborator,
  managerId,
}: {
  collaborator: OrgUser
  managerId: string
}) {
  const [periodDays, setPeriodDays] = useState<number>(30)
  const [report, setReport] = useState<GestaoReportSnapshot | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)

  const pdiData = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )
  const profiles = useSyncExternalStore(
    subscribeGestaoProfilesStore,
    getGestaoProfilesSnapshot,
    getGestaoProfilesServerSnapshot
  )
  const reportsData = useSyncExternalStore(
    subscribeGestaoReportsStore,
    getGestaoReportsSnapshot,
    getGestaoReportsServerSnapshot
  )
  const oneOnOneEntries = useSyncExternalStore(
    subscribeOneOnOneStore,
    getOneOnOneSnapshot,
    getOneOnOneServerSnapshot
  )

  const savedReport = useMemo(
    () => getLatestGestaoReport(collaborator.id),
    [collaborator.id, reportsData]
  )

  const collaboratorNotes = useMemo(
    () => oneOnOneEntries.filter((entry) => entry.userId === collaborator.id),
    [oneOnOneEntries, collaborator.id]
  )

  const displayReport = report ?? savedReport

  function generateBaseline() {
    const assignment = getActiveAssignmentForUser(collaborator.id)
    const framework = assignment ? getFrameworkById(assignment.frameworkId) : undefined
    const behavioral = getBehavioralProfile(collaborator.id)
    const softSkills = getSoftSkillsRadar(collaborator.id)
    const objectives = getObjectivesForUser(collaborator.id)
    const records = loadRecords()

    const baseline = buildManagerOneOnOneBaseline({
      collaboratorName: collaborator.name,
      days: periodDays,
      records,
      behavioral,
      softSkills,
      assignment,
      framework,
      objectives,
    })

    const snapshot = createGestaoReportSnapshot({
      userId: collaborator.id,
      managerId,
      periodStart: baseline.periodStart,
      periodEnd: baseline.periodEnd,
      sections: baseline.sections,
    })

    saveGestaoReport(snapshot)
    setReport(snapshot)
    setRefineError(null)
  }

  async function refineWithAi() {
    if (!displayReport) return
    setRegenerating(true)
    setRefineError(null)
    try {
      const res = await fetch("/api/gestao/one-on-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaboratorName: collaborator.name,
          baseline: { sections: displayReport.sections },
        }),
      })
      if (!res.ok) {
        throw new Error(`Resposta inesperada (${res.status}).`)
      }
      const data = (await res.json()) as { sections?: GestaoReportSnapshot["sections"] }
      const updated: GestaoReportSnapshot = {
        ...displayReport,
        sections: data.sections ?? displayReport.sections,
        lastEditedAt: new Date().toISOString(),
      }
      saveGestaoReport(updated)
      setReport(updated)
    } catch {
      setRefineError(
        "Não foi possível refinar com IA agora. Seu relatório foi mantido — tente novamente em instantes."
      )
    } finally {
      setRegenerating(false)
    }
  }

  function handleUpdateSection(sectionId: string, content: string) {
    if (!displayReport) return
    const updated = updateGestaoReportSection(displayReport.id, sectionId, content)
    if (updated) setReport(updated)
  }

  return (
    <div className="flex flex-col gap-6">
      {collaboratorNotes.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas registradas pelo colaborador</CardTitle>
            <p className="text-sm text-muted-foreground">
              Anotações que {collaborator.name} escreveu no próprio espaço de 1:1 — somente leitura.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {collaboratorNotes.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/80 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {formatEntryDate(entry.date)}
                </p>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {entry.notes}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Relatório para 1:1</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(periodDays)}
                onValueChange={(value) => value && setPeriodDays(Number(value))}
              >
                <SelectTrigger className="h-8 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((period) => (
                    <SelectItem key={period.id} value={String(period.days)}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={generateBaseline}>
                <FileText data-icon="inline-start" />
                Gerar relatório
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Consolida PDI, competências, perfil comportamental e evidências registradas para preparar a conversa.
          </p>
        </CardHeader>
        <CardContent>
          {displayReport ? (
            <>
              {refineError ? (
                <p
                  role="alert"
                  className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300"
                >
                  {refineError}
                </p>
              ) : null}
              <ReportEditor
                report={displayReport}
                onUpdateSection={handleUpdateSection}
                onRegenerate={refineWithAi}
                regenerating={regenerating}
              />
            </>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto mb-2 size-5 opacity-60" />
              Gere um relatório para estruturar o próximo 1:1 com {collaborator.name}.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

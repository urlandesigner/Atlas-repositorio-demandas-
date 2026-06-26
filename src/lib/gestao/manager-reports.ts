import type { RecordEntry } from "@/lib/records/types"
import type { GestaoObjective } from "@/lib/gestao/objectives/store"
import type { BehavioralProfile, SoftSkillsRadar } from "@/lib/gestao/types"
import type { PdiAssignment, PdiFramework } from "@/lib/gestao/pdi/types"
import {
  computeFrameworkReadiness,
  getFrameworkExpectations,
} from "@/lib/gestao/pdi/types"
import { DISC_PROFILES } from "@/lib/gestao/types"
import type { ReportSection } from "@/lib/evolution/types"
import { computeImpactSummary } from "@/lib/profile/derive"
import { formatPdiLevel, PDI_THEME_LABEL } from "@/lib/profile/pdi"
import { filterRecordsByRange, getDaysRange } from "@/lib/evolution/periods"

function bulletList(items: string[]): string {
  return items.length ? items.map((item) => `• ${item}`).join("\n") : "• Nenhum item identificado."
}

function topRecords(records: RecordEntry[], limit = 5): RecordEntry[] {
  return [...records]
    .sort((a, b) => b.impactLevel - a.impactLevel || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function buildManagerOneOnOneBaseline(params: {
  collaboratorName: string
  days: number
  records: RecordEntry[]
  behavioral: BehavioralProfile
  softSkills: SoftSkillsRadar
  assignment?: PdiAssignment
  framework?: PdiFramework
  objectives: GestaoObjective[]
}): { periodStart: string; periodEnd: string; sections: ReportSection[] } {
  const { start, end } = getDaysRange(params.days)
  const periodRecords = filterRecordsByRange(params.records, start, end) as RecordEntry[]
  const summary = computeImpactSummary(periodRecords)
  const top = topRecords(periodRecords, 6)

  const discLabels = params.behavioral.discProfiles
    .map((id) => DISC_PROFILES.find((profile) => profile.id === id)?.label)
    .filter(Boolean)

  let pdiSummary = "Nenhum PDI ativo atribuído pelo gestor."
  let pdiGaps: string[] = []

  if (params.assignment && params.framework) {
    const currentLevels = Object.fromEntries(
      params.framework.themes.map((theme) => [
        theme.id,
        params.assignment!.current[theme.id]?.level ?? 0,
      ])
    )
    const expected = getFrameworkExpectations(params.framework, params.assignment.currentLevelId)
    const readiness = computeFrameworkReadiness(
      currentLevels,
      expected,
      params.framework.themes.map((theme) => theme.id)
    )
    const levelName =
      params.framework.ladder.find((level) => level.id === params.assignment!.currentLevelId)
        ?.name ?? "—"

    pdiSummary = `${params.framework.name} · nível ${levelName} · prontidão ${readiness}% · ciclo ${params.assignment.cycleLabel}.`
    pdiGaps = params.framework.themes
      .filter((theme) => (currentLevels[theme.id] ?? 0) < (expected[theme.id] ?? 0))
      .slice(0, 4)
      .map(
        (theme) =>
          `${theme.label}: ${formatPdiLevel(currentLevels[theme.id] ?? 0)}/${formatPdiLevel(expected[theme.id] ?? 0)}`
      )
  }

  const softSkillLines = params.softSkills.pillars
    .map((pillar) => `${pillar.label}: ${params.softSkills.scores[pillar.id] ?? 0}/5`)
    .slice(0, 6)

  const objectiveLines = params.objectives
    .filter((objective) => objective.status !== "done")
    .slice(0, 4)
    .map(
      (objective) =>
        `${objective.title}${objective.deadline ? ` (prazo ${objective.deadline})` : ""}`
    )

  const deliveryLines = top.map(
    (record) =>
      `${record.enriched.title || "Entrega"} — impacto ${record.impactLevel}. ${record.enriched.impact?.slice(0, 100) || ""}`
  )

  const sections: ReportSection[] = [
    {
      id: "summary",
      title: "Resumo do período",
      source: "baseline",
      content: `${params.collaboratorName} registrou ${summary.totalRecords} entregas no período, com ${summary.strategicCount} iniciativas estratégicas.`,
      linkedRecordIds: top.map((record) => record.id),
    },
    {
      id: "pdi",
      title: "PDI e competências",
      source: "baseline",
      content: `${pdiSummary}\n\n${bulletList(pdiGaps.length ? pdiGaps.map((line) => `Lacuna: ${line}`) : ["Competências alinhadas ao nível atual."])}`,
    },
    {
      id: "soft_skills",
      title: "Soft skills (avaliação do gestor)",
      source: "baseline",
      content: bulletList(softSkillLines),
    },
    {
      id: "behavioral",
      title: "Perfil comportamental",
      source: "baseline",
      content: bulletList([
        discLabels.length ? `DISC: ${discLabels.join(", ")}` : "DISC não preenchido.",
        params.behavioral.strengths ? `Forças: ${params.behavioral.strengths}` : "",
        params.behavioral.attentionPoints
          ? `Pontos de atenção: ${params.behavioral.attentionPoints}`
          : "",
        params.behavioral.howToLead ? `Como liderar: ${params.behavioral.howToLead}` : "",
      ]),
    },
    {
      id: "deliveries",
      title: "Principais evidências",
      source: "baseline",
      content: bulletList(deliveryLines),
      linkedRecordIds: top.map((record) => record.id),
    },
    {
      id: "objectives",
      title: "Objetivos do ciclo",
      source: "baseline",
      content: bulletList(
        objectiveLines.length
          ? objectiveLines
          : ["Definir objetivos alinhados ao PDI e às lacunas identificadas."]
      ),
    },
    {
      id: "discussion",
      title: "Pontos para o 1:1",
      source: "baseline",
      content: bulletList(
        [
          ...pdiGaps.slice(0, 2).map((gap) => `Evolução no PDI: ${gap}`),
          ...params.softSkills.pillars
            .filter((pillar) => (params.softSkills.scores[pillar.id] ?? 0) <= 3)
            .slice(0, 2)
            .map((pillar) => `Desenvolver soft skill: ${pillar.label}`),
          ...objectiveLines.slice(0, 2).map((line) => `Acompanhar objetivo: ${line}`),
        ].slice(0, 5)
      ),
    },
  ]

  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    sections,
  }
}

import type { RecordEntry } from "@/lib/records/types"
import type { ObjectiveEntry } from "@/lib/objectives/store"
import type { PresentationEntry } from "@/lib/presentations/store"
import type { CareerGoal, ProfileIdentity } from "@/lib/profile/types"
import { computeImpactSummary } from "@/lib/profile/derive"
import { computePdiGaps, computePdiReadiness, PDI_THEME_LABEL, type PdiTheme } from "@/lib/profile/pdi"
import { countStrongCompetencies, computeCompetencyEvidence } from "./radar"
import type { RecognitionEntry, ReportSection, ReportSnapshot } from "./types"
import { filterRecordsByRange, getDaysRange } from "./periods"

const ATUACAO_LABEL: Record<string, string> = {
  liderança: "Liderança",
  execução: "Execução",
  estratégia: "Estratégia",
  arquitetura: "Arquitetura",
  mentoria: "Mentoria",
  inovação: "Inovação",
}

function bulletList(items: string[]): string {
  return items.length ? items.map((i) => `• ${i}`).join("\n") : "• Nenhum item identificado no período."
}

function topRecords(records: RecordEntry[], limit = 5): RecordEntry[] {
  return [...records]
    .sort((a, b) => b.impactLevel - a.impactLevel || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function buildOneOnOneBaseline(params: {
  records: RecordEntry[]
  objectives: ObjectiveEntry[]
  identity: ProfileIdentity
  currentLevels: Record<PdiTheme, number>
  expectedLevels: Record<PdiTheme, number>
  days: number
}): Omit<ReportSnapshot, "id" | "generatedAt" | "lastEditedAt"> {
  const { start, end } = getDaysRange(params.days)
  const periodRecords = filterRecordsByRange(params.records, start, end) as RecordEntry[]
  const summary = computeImpactSummary(periodRecords)
  const top = topRecords(periodRecords, 6)
  const gaps = computePdiGaps(params.currentLevels, params.expectedLevels).slice(0, 3)
  const activeObjectives = params.objectives.filter((o) => o.status !== "done").slice(0, 4)

  const deliveries = top.map(
    (r) =>
      `${r.enriched.title || "Entrega"} — ${ATUACAO_LABEL[r.atuacao] || r.atuacao}, impacto nível ${r.impactLevel}. ${r.enriched.impact?.slice(0, 120) || ""}`
  )

  const impacts = top
    .filter((r) => r.enriched.impact?.trim())
    .map((r) => `${r.enriched.title}: ${r.enriched.impact}`)

  const challenges = periodRecords
    .filter((r) => r.enriched.learnings?.trim())
    .slice(0, 4)
    .map((r) => `${r.enriched.title}: ${r.enriched.learnings}`)

  const discussionTopics = [
    ...gaps.map((g) => `Evolução em ${g.label}: nível ${g.current} de ${g.expected} esperado`),
    ...activeObjectives.map((o) => `Objetivo em andamento: ${o.title}`),
  ].slice(0, 5)

  const sections: ReportSection[] = [
    {
      id: "summary",
      title: "Resumo do período",
      source: "baseline",
      content: `${params.identity.name} registrou ${summary.totalRecords} entregas no período, com ${summary.strategicCount} iniciativas estratégicas e ${summary.leadershipCount} ações de liderança.`,
      linkedRecordIds: top.map((r) => r.id),
    },
    {
      id: "deliveries",
      title: "Principais entregas",
      source: "baseline",
      content: bulletList(deliveries),
      linkedRecordIds: top.map((r) => r.id),
    },
    {
      id: "impacts",
      title: "Impactos gerados",
      source: "baseline",
      content: bulletList(impacts),
      linkedRecordIds: top.map((r) => r.id),
    },
    {
      id: "challenges",
      title: "Desafios e aprendizados",
      source: "baseline",
      content: bulletList(challenges.length ? challenges : ["Nenhum aprendizado explícito — considere registrar reflexões nos registros."]),
    },
    {
      id: "priorities",
      title: "Próximas prioridades",
      source: "baseline",
      content: bulletList(
        activeObjectives.length
          ? activeObjectives.map((o) => `${o.title}${o.deadline ? ` (prazo ${o.deadline})` : ""}`)
          : ["Definir objetivos alinhados às lacunas do PDI."]
      ),
    },
    {
      id: "discussion",
      title: "Pontos para discutir com liderança",
      source: "baseline",
      content: bulletList(discussionTopics),
    },
  ]

  return {
    type: "one_on_one",
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    sections,
  }
}

export function buildPromotionBaseline(params: {
  records: RecordEntry[]
  objectives: ObjectiveEntry[]
  recognitions: RecognitionEntry[]
  presentations: PresentationEntry[]
  identity: ProfileIdentity
  goal: CareerGoal
  currentLevelName: string
  currentLevels: Record<PdiTheme, number>
  expectedLevels: Record<PdiTheme, number>
  targetLevelId: string
}): Omit<ReportSnapshot, "id" | "generatedAt" | "lastEditedAt"> {
  const now = new Date()
  const { start } = getDaysRange(365, now)
  const yearRecords = filterRecordsByRange(params.records, start, now) as RecordEntry[]
  const top = topRecords(yearRecords, 8)
  const readiness = computePdiReadiness(params.currentLevels, params.expectedLevels)
  const competencyViews = computeCompetencyEvidence(
    params.records,
    params.currentLevels,
    params.expectedLevels,
    params.targetLevelId
  )
  const strongCount = countStrongCompetencies(competencyViews)
  const doneObjectives = params.objectives.filter((o) => o.status === "done").slice(0, 5)

  const contributions = top.map(
    (r) =>
      `**${r.enriched.title}** — ${r.enriched.impact || r.enriched.contribution || "Impacto a detalhar."}`
  )

  const competencies = competencyViews
    .filter((c) => c.evidenceCount > 0)
    .map(
      (c) =>
        `${c.label}: ${c.status === "forte" ? "bem evidenciado" : c.status === "em_evolucao" ? "em construção" : "poucas evidências"} (${c.evidenceCount} registros)`
    )

  const recognitionLines = params.recognitions
    .slice(0, 6)
    .map((r) => `${r.date.slice(0, 10)} — ${r.title} (${r.recognizedBy})`)

  const sections: ReportSection[] = [
    {
      id: "executive",
      title: "Resumo executivo",
      source: "baseline",
      content: `${params.identity.name}, ${params.identity.role}, busca evoluir para ${params.goal.targetRole}. Com ${readiness}% dos temas PDI no nível esperado e ${strongCount} competências bem evidenciadas para o próximo nível, o dossiê consolida ${yearRecords.length} registros do último ano como base de conversa sobre progressão.`,
    },
    {
      id: "context",
      title: "Contexto de carreira",
      source: "baseline",
      content: `Nível atual: ${params.currentLevelName}. Área: ${params.identity.area}${params.identity.squad ? ` · ${params.identity.squad}` : ""}. Objetivo declarado: ${params.goal.targetRole}${params.goal.targetYear ? ` até ${params.goal.targetYear}` : ""}.`,
    },
    {
      id: "goal",
      title: "Objetivo de carreira",
      source: "baseline",
      content: params.goal.notes?.trim() || `Consolidar evidências para ${params.goal.targetRole}, demonstrando impacto organizacional e maturidade nas competências esperadas.`,
    },
    {
      id: "contributions",
      title: "Principais contribuições",
      source: "baseline",
      content: contributions.length ? contributions.join("\n\n") : "Nenhuma contribuição registrada no período.",
      linkedRecordIds: top.map((r) => r.id),
    },
    {
      id: "competencies",
      title: "Competências demonstradas",
      source: "baseline",
      content: bulletList(competencies.length ? competencies : ["Registre mais evidências para mapear competências."]),
    },
    {
      id: "projects",
      title: "Projetos mais relevantes",
      source: "baseline",
      content: bulletList(
        Array.from(new Set(top.map((r) => r.projectName).filter(Boolean) as string[])).slice(0, 6)
      ),
    },
    {
      id: "recognitions",
      title: "Reconhecimentos",
      source: "baseline",
      content: bulletList(
        recognitionLines.length
          ? recognitionLines
          : ["Nenhum reconhecimento registrado — adicione feedbacks recebidos na área de Reconhecimentos."]
      ),
    },
    {
      id: "evidence",
      title: "Evidências",
      source: "baseline",
      content: bulletList([
        `${yearRecords.length} registros profissionais no último ano`,
        `${doneObjectives.length} objetivos concluídos`,
        `${params.presentations.filter((p) => p.status === "done").length} apresentações realizadas`,
        ...gapsToLines(params.currentLevels, params.expectedLevels),
      ]),
      linkedRecordIds: top.map((r) => r.id),
    },
    {
      id: "next",
      title: "Próximos passos",
      source: "baseline",
      content: bulletList(
        competencyViews
          .filter((c) => c.status !== "forte")
          .slice(0, 4)
          .map((c) => c.suggestedNextSteps[0])
          .filter(Boolean)
      ),
    },
  ]

  return {
    type: "promotion",
    periodStart: start.toISOString(),
    periodEnd: now.toISOString(),
    targetRole: params.goal.targetRole,
    targetLevelId: params.goal.targetLevelId,
    sections,
  }
}

function gapsToLines(current: Record<PdiTheme, number>, expected: Record<PdiTheme, number>): string[] {
  return computePdiGaps(current, expected)
    .slice(0, 3)
    .map((g) => `Lacuna em ${PDI_THEME_LABEL[g.theme]}: ${g.current}/${g.expected}`)
}

export function createReportSnapshot(
  baseline: Omit<ReportSnapshot, "id" | "generatedAt" | "lastEditedAt">
): ReportSnapshot {
  const now = new Date().toISOString()
  return {
    ...baseline,
    id: crypto.randomUUID(),
    generatedAt: now,
    lastEditedAt: now,
  }
}

export function reportToMarkdown(report: ReportSnapshot): string {
  const header =
    report.type === "one_on_one"
      ? "# Relatório para 1:1\n"
      : `# Dossiê de Promoção — ${report.targetRole || "Evolução de carreira"}\n`

  const period = `_Período: ${new Date(report.periodStart).toLocaleDateString("pt-BR")} — ${new Date(report.periodEnd).toLocaleDateString("pt-BR")}_\n\n`

  const body = report.sections.map((s) => `## ${s.title}\n\n${s.content}`).join("\n\n")

  return `${header}${period}${body}\n\n---\n_Interpretação baseada em evidências registradas. Não substitui avaliação formal._`
}

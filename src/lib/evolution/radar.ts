import type { RecordEntry } from "@/lib/records/types"
import type { PdiTheme } from "@/lib/profile/pdi"
import { PDI_MAX_LEVEL } from "@/lib/profile/pdi"
import { RECENT_WINDOW_DAYS, ageInDays } from "@/lib/profile/derive"
import { getCompetencyLensesForTarget, recordMatchesCompetency } from "./competencies"
import type { CompetencyEvidenceView, EvidenceStatus } from "./types"

function avgThemeLevel(themeIds: PdiTheme[], levels: Record<PdiTheme, number>): number {
  if (!themeIds.length) return 0
  const sum = themeIds.reduce((acc, id) => acc + (levels[id] ?? 0), 0)
  return Math.round((sum / themeIds.length) * 10) / 10
}

function deriveStatus(
  evidenceCount: number,
  recentCount: number,
  perceived: number,
  expected: number
): EvidenceStatus {
  if (evidenceCount >= 3 && recentCount >= 2 && perceived >= expected - 0.5) return "forte"
  if (evidenceCount >= 2 || perceived >= expected - 1) return "em_evolucao"
  return "pouco_evidenciado"
}

function suggestNextSteps(
  competencyId: string,
  status: EvidenceStatus,
  evidenceCount: number
): string[] {
  if (status === "forte") {
    return ["Consolide estas evidências em conversas de 1:1 e no relatório de promoção."]
  }

  const byId: Record<string, string[]> = {
    "lideranca-tecnica": [
      "Registre decisões técnicas e como você apoiou a squad.",
      "Documente mentoria ou revisões que elevaram a qualidade do time.",
    ],
    "influencia-cross": [
      "Registre iniciativas com impacto em mais de um time ou área.",
      "Descreva como você alinhou stakeholders em entregas estratégicas.",
    ],
    "gestao-stakeholders": [
      "Documente alinhamentos, trade-offs e negociações com stakeholders.",
    ],
    mentoria: [
      "Registre sessões de mentoria, pairing ou desenvolvimento de pessoas.",
    ],
    "estrategia-produto": [
      "Capture decisões de produto com contexto, objetivo e impacto esperado.",
    ],
    "comunicacao-executiva": [
      "Vincule apresentações e registre narrativas para liderança.",
    ],
    "tomada-decisao": [
      "Preencha o campo de decisões nos registros com o racional e impacto.",
    ],
    "visao-sistemica": [
      "Registre arquiteturas, padrões e melhorias com alcance além do squad.",
    ],
  }

  const steps = byId[competencyId] ?? ["Registre entregas que demonstrem esta competência."]
  if (evidenceCount === 0) return [steps[0]]
  return steps.slice(0, 2)
}

export function computeCompetencyEvidence(
  records: RecordEntry[],
  currentLevels: Record<PdiTheme, number>,
  expectedLevels: Record<PdiTheme, number>,
  targetLevelId: string,
  now: number = Date.now()
): CompetencyEvidenceView[] {
  const lenses = getCompetencyLensesForTarget(targetLevelId)

  return lenses.map((lens) => {
    const linkedRecordIds = records
      .filter((r) => recordMatchesCompetency(r, lens.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => r.id)

    const recentEvidenceCount = records.filter(
      (r) =>
        linkedRecordIds.includes(r.id) && ageInDays(r.createdAt, now) <= RECENT_WINDOW_DAYS
    ).length

    const perceivedLevel = avgThemeLevel(lens.themeIds, currentLevels)
    const expectedLevel = avgThemeLevel(lens.themeIds, expectedLevels)
    const status = deriveStatus(linkedRecordIds.length, recentEvidenceCount, perceivedLevel, expectedLevel)

    const confidence: CompetencyEvidenceView["confidence"] =
      linkedRecordIds.length >= 4 ? "alta" : linkedRecordIds.length >= 1 ? "media" : "baixa"

    return {
      competencyId: lens.id,
      label: lens.label,
      description: lens.description,
      perceivedLevel: Math.min(perceivedLevel, PDI_MAX_LEVEL),
      expectedLevel: Math.min(expectedLevel, PDI_MAX_LEVEL),
      evidenceCount: linkedRecordIds.length,
      recentEvidenceCount,
      status,
      linkedRecordIds,
      suggestedNextSteps: suggestNextSteps(lens.id, status, linkedRecordIds.length),
      confidence,
    }
  })
}

export function countStrongCompetencies(views: CompetencyEvidenceView[]): number {
  return views.filter((v) => v.status === "forte").length
}

import type { RecordEntry } from "@/lib/records/types"
import type { CompetencyLens } from "./types"

export const LEAD_COMPETENCY_LENSES: CompetencyLens[] = [
  {
    id: "lideranca-tecnica",
    label: "Liderança técnica",
    description: "Referência técnica, direcionamento e suporte à squad.",
    themeIds: ["tecnologia", "pessoas"],
    targetLevelIds: ["lead", "especialista"],
  },
  {
    id: "influencia-cross",
    label: "Influência cross-team",
    description: "Atuação que mobiliza times e áreas além do squad direto.",
    themeIds: ["influencia"],
    targetLevelIds: ["lead", "especialista", "senior-2"],
  },
  {
    id: "gestao-stakeholders",
    label: "Gestão de stakeholders",
    description: "Alinhamento, negociação e clareza com partes interessadas.",
    themeIds: ["influencia", "dominio"],
    targetLevelIds: ["lead"],
  },
  {
    id: "mentoria",
    label: "Mentoria",
    description: "Desenvolvimento de pessoas e compartilhamento de conhecimento.",
    themeIds: ["pessoas", "estudo"],
    targetLevelIds: ["lead", "especialista", "senior-2"],
  },
  {
    id: "estrategia-produto",
    label: "Estratégia de produto",
    description: "Decisões e direcionamento com visão de negócio e produto.",
    themeIds: ["dominio", "processos"],
    targetLevelIds: ["lead", "especialista"],
  },
  {
    id: "comunicacao-executiva",
    label: "Comunicação executiva",
    description: "Clareza em apresentações, narrativas e alinhamentos de alto nível.",
    themeIds: ["influencia", "estudo"],
    targetLevelIds: ["lead"],
  },
  {
    id: "tomada-decisao",
    label: "Tomada de decisão",
    description: "Decisões documentadas com trade-offs e impacto claro.",
    themeIds: ["dominio", "processos"],
    targetLevelIds: ["lead", "especialista", "senior-2"],
  },
  {
    id: "visao-sistemica",
    label: "Visão sistêmica",
    description: "Arquitetura, padrões e impacto em escala além de entregas pontuais.",
    themeIds: ["dominio", "processos", "tecnologia"],
    targetLevelIds: ["lead", "especialista"],
  },
]

export const COMPETENCY_OPTIONS = LEAD_COMPETENCY_LENSES.map((lens) => lens.id) as [
  CompetencyLens["id"],
  ...CompetencyLens["id"][],
]

export const COMPETENCY_LABEL = Object.fromEntries(
  LEAD_COMPETENCY_LENSES.map((lens) => [lens.id, lens.label])
) as Record<CompetencyLens["id"], string>

function normalizeText(record: RecordEntry): string {
  return [record.enriched.impact, record.enriched.contribution, record.enriched.decisions, record.tags.join(" ")]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

export function recordMatchesCompetency(record: RecordEntry, competencyId: string): boolean {
  const text = normalizeText(record)

  switch (competencyId) {
    case "lideranca-tecnica":
      return ["liderança", "arquitetura", "mentoria"].includes(record.atuacao) || record.impactLevel >= 4
    case "influencia-cross":
      return record.impactScope === "area" || record.impactScope === "company" || /(cross|multidisciplinar|stakeholder)/.test(text)
    case "gestao-stakeholders":
      return /(stakeholder|alinh|negoci|prioriz|executiv)/.test(text) || record.impactScope === "company"
    case "mentoria":
      return record.atuacao === "mentoria" || /(mentor|coaching|desenvolv)/.test(text)
    case "estrategia-produto":
      return record.atuacao === "estratégia" || /(estrateg|roadmap|prioriz|produto)/.test(text)
    case "comunicacao-executiva":
      return /(apresent|comunic|narrativ|executiv|visibilidade)/.test(text) || record.impactLevel >= 4
    case "tomada-decisao":
      return Boolean(record.enriched.decisions?.trim()) || /(decis|trade-off|escolh)/.test(text)
    case "visao-sistemica":
      return (
        record.atuacao === "arquitetura" ||
        record.area === "design-system" ||
        /(sistem|arquitet|padron|escala|design system)/.test(text)
      )
    default:
      return false
  }
}

export function getCompetencyLensesForTarget(targetLevelId: string): CompetencyLens[] {
  const matched = LEAD_COMPETENCY_LENSES.filter((lens) => lens.targetLevelIds.includes(targetLevelId))
  return matched.length ? matched : LEAD_COMPETENCY_LENSES.slice(0, 6)
}

export function getMatchingCompetencies(
  partial: Pick<RecordEntry, "atuacao" | "area" | "impactScope" | "impactLevel" | "tags" | "enriched">
): CompetencyLens[] {
  return LEAD_COMPETENCY_LENSES.filter((lens) =>
    recordMatchesCompetency(partial as RecordEntry, lens.id)
  )
}

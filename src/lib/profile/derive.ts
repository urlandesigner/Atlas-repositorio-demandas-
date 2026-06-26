import type { AreaType, AtuacaoType, ImpactScope, RecordEntry } from "@/lib/records/types"

// ─────────────────────────────────────────────────────────────────────────────
// Princípio: o perfil é uma LENTE sobre os registros. Nada aqui é armazenado —
// tudo é recalculado a partir de RecordEntry[]. Funções puras e testáveis.
// O modelo de competências agora é a Matriz PDI (ver lib/profile/pdi.ts); este
// módulo cobre resumo de impacto, conquistas, timeline e o scoring compartilhado.
// ─────────────────────────────────────────────────────────────────────────────

export interface ImpactSummary {
  totalRecords: number
  projectCount: number
  strategicCount: number
  leadershipCount: number
  mentorshipCount: number
}

export interface Insight {
  id: string
  text: string
  /** Título sugerido de objetivo, quando a oportunidade aceita virar meta. */
  suggestedObjective?: string
}

export interface ProfileInsights {
  highlights: Insight[]
  opportunities: Insight[]
}

// ─── Pesos e calibragem (compartilhados com a Matriz PDI) ────────────────────

// Escopo amplifica o impacto: uma entrega que afeta a empresa pesa mais que uma
// pessoal. Multiplica o impactLevel (1–5) de cada registro.
export const SCOPE_WEIGHT: Record<ImpactScope, number> = {
  personal: 1,
  team: 2,
  area: 3,
  company: 4,
}

// Recência: registros recentes pesam mais para refletir trajetória ATUAL, mas
// o histórico nunca zera — mantém um piso. half-life ~180 dias.
const RECENCY_HALF_LIFE_DAYS = 180
const RECENCY_FLOOR = 0.3

export const RECENT_WINDOW_DAYS = 90

const ATUACAO_LABEL: Record<AtuacaoType, string> = {
  liderança: "Liderança",
  execução: "Execução",
  estratégia: "Estratégia",
  arquitetura: "Arquitetura",
  mentoria: "Mentoria",
  inovação: "Inovação",
}

// Áreas que contam como "disciplina" para a conquista de multidisciplinaridade.
const MEANINGFUL_AREAS: AreaType[] = [
  "produto",
  "ux",
  "design-system",
  "engenharia",
  "processo",
  "cultura",
]

// ─── Scoring compartilhado ───────────────────────────────────────────────────

export function ageInDays(iso: string, now: number): number {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, (now - t) / 86_400_000)
}

export function recencyFactor(ageDays: number): number {
  const decay = Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS)
  return RECENCY_FLOOR + (1 - RECENCY_FLOOR) * decay
}

export function recordWeight(record: RecordEntry, now: number): number {
  const base = record.impactLevel * SCOPE_WEIGHT[record.impactScope]
  return base * recencyFactor(ageInDays(record.createdAt, now))
}

// ─── Resumo de impacto ───────────────────────────────────────────────────────

export function computeImpactSummary(records: RecordEntry[]): ImpactSummary {
  const projectIds = new Set<string>()
  let strategicCount = 0
  let leadershipCount = 0
  let mentorshipCount = 0

  for (const record of records) {
    if (record.projectId) projectIds.add(record.projectId)
    if (record.atuacao === "estratégia") strategicCount += 1
    if (record.atuacao === "liderança") leadershipCount += 1
    if (record.atuacao === "mentoria") mentorshipCount += 1
  }

  return {
    totalRecords: records.length,
    projectCount: projectIds.size,
    strategicCount,
    leadershipCount,
    mentorshipCount,
  }
}

// ─── Conquistas (marcos derivados) ───────────────────────────────────────────

export interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
  /** Presente apenas em conquistas de acúmulo (mostra barra de progresso). */
  progress?: { current: number; target: number }
}

export function computeAchievements(records: RecordEntry[]): Achievement[] {
  const total = records.length
  const strategic = records.filter((r) => r.atuacao === "estratégia").length
  const mentorship = records.filter((r) => r.atuacao === "mentoria").length
  const leadership = records.filter((r) => r.atuacao === "liderança").length
  const crossTeam = records.filter(
    (r) => r.impactScope === "area" || r.impactScope === "company"
  ).length
  const orgImpact = records.filter((r) => r.impactScope === "company").length
  const distinctAreas = new Set(
    records.map((r) => r.area).filter((area) => MEANINGFUL_AREAS.includes(area))
  ).size

  return [
    {
      id: "first-record",
      title: "Primeira evidência",
      description: "Documentou a primeira atuação no Atlas.",
      unlocked: total >= 1,
    },
    {
      id: "first-strategic",
      title: "Iniciativa estratégica",
      description: "Registrou uma atuação de natureza estratégica.",
      unlocked: strategic >= 1,
    },
    {
      id: "first-mentorship",
      title: "Mentoria registrada",
      description: "Documentou uma ação de mentoria.",
      unlocked: mentorship >= 1,
    },
    {
      id: "cross-team",
      title: "Atuação cross-team",
      description: "Gerou impacto além do próprio time.",
      unlocked: crossTeam >= 1,
    },
    {
      id: "org-impact",
      title: "Impacto organizacional",
      description: "Entregou algo com alcance de empresa.",
      unlocked: orgImpact >= 1,
    },
    {
      id: "multidisciplinar",
      title: "Atuação multidisciplinar",
      description: "Evidências em quatro áreas distintas.",
      unlocked: distinctAreas >= 4,
      progress: { current: Math.min(distinctAreas, 4), target: 4 },
    },
    {
      id: "leadership-10",
      title: "Liderança consistente",
      description: "Dez ações de liderança registradas.",
      unlocked: leadership >= 10,
      progress: { current: Math.min(leadership, 10), target: 10 },
    },
    {
      id: "volume-50",
      title: "Histórico robusto",
      description: "Cinquenta registros de impacto.",
      unlocked: total >= 50,
      progress: { current: Math.min(total, 50), target: 50 },
    },
  ]
}

// ─── Timeline profissional consolidada ───────────────────────────────────────

export interface TimelineItem {
  id: string
  title: string
  date: string
  roleLabel: string
}

export interface TimelineGroup {
  /** "mai 2026" */
  monthLabel: string
  items: TimelineItem[]
}

export function computeTimeline(records: RecordEntry[], limit = 12): TimelineGroup[] {
  const sorted = [...records]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)

  const groups: TimelineGroup[] = []
  let currentLabel: string | null = null

  for (const record of sorted) {
    const label = new Date(record.createdAt).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    })
    if (label !== currentLabel) {
      groups.push({ monthLabel: label, items: [] })
      currentLabel = label
    }
    groups[groups.length - 1].items.push({
      id: record.id,
      title: record.enriched.title || "Registro de impacto",
      date: record.createdAt,
      roleLabel: ATUACAO_LABEL[record.atuacao],
    })
  }

  return groups
}

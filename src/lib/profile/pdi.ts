import type { AreaType, AtuacaoType, RecordEntry } from "@/lib/records/types"
import type { ObjectiveEntry, ObjectiveStatus, PdiDimension } from "@/lib/objectives/store"
import { countObjectiveEvidence } from "@/lib/objectives/store"
import { recordWeight, RECENT_WINDOW_DAYS, type Insight, type ProfileInsights } from "./derive"

// ─────────────────────────────────────────────────────────────────────────────
// Matriz PDI — régua oficial de competência da empresa: 6 temas × níveis 0–6.
// O nível ATUAL é sugerido pelas evidências (registros) e confirmado pelo usuário;
// o nível ESPERADO vem do cargo. Tudo aqui é puro (sem window) — o estado mora
// em pdi-store.ts. Os 6 temas reaproveitam as PdiDimension já usadas em objetivos.
// ─────────────────────────────────────────────────────────────────────────────

export type PdiTheme =
  | "tecnologia"
  | "dominio"
  | "pessoas"
  | "processos"
  | "influencia"
  | "estudo"

export const PDI_THEMES: PdiTheme[] = [
  "tecnologia",
  "dominio",
  "pessoas",
  "processos",
  "influencia",
  "estudo",
]

export const PDI_THEME_LABEL: Record<PdiTheme, string> = {
  tecnologia: "Tecnologia",
  dominio: "Domínio",
  pessoas: "Pessoas",
  processos: "Processos",
  influencia: "Influência",
  estudo: "Estudo",
}

export const PDI_MAX_LEVEL = 6

export function formatPdiLevel(level: number): number {
  return Math.max(1, Math.min(PDI_MAX_LEVEL + 1, Math.round(level) + 1))
}

// Rubrica: descritor de cada nível (índice 0–6) por tema. Dado de referência
// editável — transcrito da matriz de avaliação da empresa.
export const PDI_RUBRIC: Record<PdiTheme, string[]> = {
  tecnologia: [
    "Aprendendo",
    "Conhecimento baixo",
    "Conhecimento médio",
    "Utiliza muito bem",
    "Auxilia a squad e a stack",
    "Referência técnica",
    "Cria/promove inovações",
  ],
  dominio: [
    "Conhecendo as regras",
    "Aprendendo sobre o negócio",
    "Domina razoavelmente as regras",
    "Domina as regras no geral",
    "Apoia o time com as regras",
    "Referência para o time",
    "Ajuda a definir e tomar decisões",
  ],
  pessoas: [
    "Precisa de auxílio total",
    "Precisa bastante de auxílio",
    "Precisa pouco de auxílio",
    "Não precisa de auxílio",
    "Auxilia",
    "Mentora",
    "Coordena",
  ],
  processos: [
    "Aprendendo",
    "Segue com apoio",
    "Segue com pouco apoio",
    "Segue sem apoio",
    "Desafia",
    "Aprimora",
    "Define",
  ],
  influencia: [
    "Não influencia",
    "Baixa influência",
    "Influencia um pouco",
    "Sempre influencia todos à sua volta",
    "Influencia direta e indiretamente",
    "Influencia o time/equipe",
    "Influencia a empresa",
  ],
  estudo: [
    "Básico",
    "Aprendendo sobre a stack",
    "O suficiente para o dia a dia",
    "Além do necessário",
    "Para se tornar especialista",
    "Para trazer melhorias ao projeto",
    "Para ensinar",
  ],
}

// ─── Mapeamento evidência → tema ─────────────────────────────────────────────
// Cada registro contribui para um ou mais temas, com peso relativo. É fuzzy de
// propósito: a IA sugere, o humano confirma.

const ATUACAO_THEME_WEIGHT: Record<AtuacaoType, Partial<Record<PdiTheme, number>>> = {
  liderança: { pessoas: 1, influencia: 1 },
  mentoria: { pessoas: 1.2, estudo: 0.5 },
  estratégia: { dominio: 1, influencia: 0.6 },
  arquitetura: { tecnologia: 1.2 },
  execução: { tecnologia: 0.5, processos: 0.6 },
  inovação: { estudo: 0.8, tecnologia: 0.5, processos: 0.4 },
}

const AREA_THEME_WEIGHT: Partial<Record<AreaType, Partial<Record<PdiTheme, number>>>> = {
  produto: { dominio: 1 },
  ux: { dominio: 0.5, tecnologia: 0.4 },
  "design-system": { tecnologia: 1, processos: 0.5 },
  engenharia: { tecnologia: 1.1 },
  processo: { processos: 1.2 },
  cultura: { pessoas: 0.8, influencia: 0.5 },
  operacional: { processos: 0.7 },
}

// As dimensões de objetivo que mapeiam 1:1 para um tema da matriz.
const OBJECTIVE_DIMENSION_THEME: Partial<Record<PdiDimension, PdiTheme>> = {
  tecnologia: "tecnologia",
  dominio: "dominio",
  pessoas: "pessoas",
  processos: "processos",
  influencia: "influencia",
  estudo: "estudo",
}

// Curva saturante para mapear score de evidência → nível 0–6.
// K calibrado para que evidência moderada (~5 registros relevantes) chegue a ~4.
const PDI_SATURATION_K = 28

// Bônus por objetivo concluído marcado no tema — sinal de crescimento deliberado.
const OBJECTIVE_DONE_BONUS = 6

function levelFromScore(score: number): number {
  return Math.round(PDI_MAX_LEVEL * (1 - Math.exp(-score / PDI_SATURATION_K)))
}

// ─── Sugestão de nível por tema ──────────────────────────────────────────────

// Calcula o score de evidência por tema a partir dos registros e objetivos.
export function computePdiThemeScores(
  records: RecordEntry[],
  objectives: ObjectiveEntry[] = [],
  now: number = Date.now()
): Record<PdiTheme, number> {
  const scores = Object.fromEntries(PDI_THEMES.map((t) => [t, 0])) as Record<PdiTheme, number>

  for (const record of records) {
    const weight = recordWeight(record, now)

    const atuacaoWeights = ATUACAO_THEME_WEIGHT[record.atuacao]
    for (const [theme, factor] of Object.entries(atuacaoWeights) as [PdiTheme, number][]) {
      scores[theme] += weight * factor
    }

    const areaWeights = AREA_THEME_WEIGHT[record.area]
    if (areaWeights) {
      for (const [theme, factor] of Object.entries(areaWeights) as [PdiTheme, number][]) {
        scores[theme] += weight * factor
      }
    }

    // Escopo amplo é evidência direta de influência.
    if (record.impactScope === "area" || record.impactScope === "company") {
      scores.influencia += weight * 0.6
    }
  }

  for (const objective of objectives) {
    if (objective.status !== "done") continue
    for (const dimension of objective.dimensions) {
      const theme = OBJECTIVE_DIMENSION_THEME[dimension]
      if (theme) scores[theme] += OBJECTIVE_DONE_BONUS
    }
  }

  return scores
}

// Sugere um nível 0–6 por tema. Limita a esperado+1 para não superestimar.
export function suggestPdiLevels(
  records: RecordEntry[],
  objectives: ObjectiveEntry[],
  expected: Record<PdiTheme, number>,
  now: number = Date.now()
): Record<PdiTheme, number> {
  const scores = computePdiThemeScores(records, objectives, now)
  const result = {} as Record<PdiTheme, number>
  for (const theme of PDI_THEMES) {
    const raw = levelFromScore(scores[theme])
    const ceiling = Math.min((expected[theme] ?? PDI_MAX_LEVEL) + 1, PDI_MAX_LEVEL)
    result[theme] = Math.max(0, Math.min(raw, ceiling))
  }
  return result
}

// ─── Prontidão e gaps ────────────────────────────────────────────────────────

export interface PdiGap {
  theme: PdiTheme
  label: string
  current: number
  expected: number
  /** Quantos níveis faltam (>0 = abaixo do esperado). */
  deficit: number
}

export function computePdiGaps(
  current: Record<PdiTheme, number>,
  expected: Record<PdiTheme, number>
): PdiGap[] {
  return PDI_THEMES.map((theme) => ({
    theme,
    label: PDI_THEME_LABEL[theme],
    current: current[theme] ?? 0,
    expected: expected[theme] ?? 0,
    deficit: (expected[theme] ?? 0) - (current[theme] ?? 0),
  })).filter((gap) => gap.deficit > 0)
}

// 0–100: proporção de temas no nível esperado ou acima.
export function computePdiReadiness(
  current: Record<PdiTheme, number>,
  expected: Record<PdiTheme, number>
): number {
  const met = PDI_THEMES.filter((theme) => (current[theme] ?? 0) >= (expected[theme] ?? 0)).length
  return Math.round((met / PDI_THEMES.length) * 100)
}

// ─── Insights derivados da matriz ────────────────────────────────────────────

export function computePdiInsights(
  current: Record<PdiTheme, number>,
  expected: Record<PdiTheme, number>
): ProfileInsights {
  const highlights: Insight[] = []
  const opportunities: Insight[] = []

  // Destaques — temas no nível esperado ou acima (do maior nível para o menor).
  const strengths = PDI_THEMES.filter((t) => (current[t] ?? 0) >= (expected[t] ?? 0))
    .sort((a, b) => (current[b] ?? 0) - (current[a] ?? 0))
  for (const theme of strengths.slice(0, 2)) {
    const above = (current[theme] ?? 0) > (expected[theme] ?? 0)
    highlights.push({
      id: `strength-${theme}`,
      text: above
        ? `${PDI_THEME_LABEL[theme]} acima do esperado`
        : `${PDI_THEME_LABEL[theme]} no nível esperado`,
    })
  }

  // Oportunidades — maiores gaps primeiro, cada um sugere um objetivo no tema.
  const gaps = computePdiGaps(current, expected).sort((a, b) => b.deficit - a.deficit)
  for (const gap of gaps.slice(0, 3)) {
    opportunities.push({
      id: `gap-${gap.theme}`,
      text: `${gap.label}: nível ${gap.current} de ${gap.expected} esperado`,
      suggestedObjective: `Evoluir em ${gap.label.toLowerCase()}`,
    })
  }

  return { highlights: highlights.slice(0, 3), opportunities }
}

// ─── Avanço via objetivos (sobre o baseline do último PDI) ───────────────────

/** 0–1: progresso de um objetivo (mesma lógica da página de objetivos). */
export function getObjectiveCompletionRatio(objective: ObjectiveEntry): number {
  if (objective.status === "done") return 1
  const evidenceScore = Math.min(countObjectiveEvidence(objective) * 25, 75)
  const statusScore =
    objective.status === "in_progress" ? 15 : objective.status === "paused" ? 5 : 0
  return Math.min(evidenceScore + statusScore, 95) / 100
}

export interface ThemeObjectiveProgress {
  theme: PdiTheme
  baselineLevel: number
  projectedLevel: number
  /** Ganho estimado em níveis (0–1+). */
  delta: number
  linkedObjectives: number
  doneObjectives: number
  activeObjectives: number
  /** Média 0–100 do progresso dos objetivos vinculados ao tema. */
  momentumPercent: number
}

const OBJECTIVE_LEVEL_BOOST = 0.45

function objectiveTouchesTheme(objective: ObjectiveEntry, theme: PdiTheme): boolean {
  return objective.dimensions.includes(theme as PdiDimension)
}

function isActiveObjectiveStatus(status: ObjectiveStatus): boolean {
  return status === "planned" || status === "in_progress" || status === "paused"
}

export function computeThemeObjectiveProgress(
  theme: PdiTheme,
  baseline: Record<PdiTheme, number>,
  objectives: ObjectiveEntry[],
  expected: Record<PdiTheme, number>
): ThemeObjectiveProgress {
  const linked = objectives.filter((objective) => objectiveTouchesTheme(objective, theme))
  let boost = 0
  let momentumTotal = 0

  for (const objective of linked) {
    const ratio = getObjectiveCompletionRatio(objective)
    boost += ratio * OBJECTIVE_LEVEL_BOOST
    momentumTotal += ratio
  }

  const ceiling = Math.min((expected[theme] ?? PDI_MAX_LEVEL) + 1, PDI_MAX_LEVEL)
  const baselineLevel = baseline[theme] ?? 0
  const projectedLevel = Math.min(baselineLevel + boost, ceiling)

  return {
    theme,
    baselineLevel,
    projectedLevel,
    delta: projectedLevel - baselineLevel,
    linkedObjectives: linked.length,
    doneObjectives: linked.filter((objective) => objective.status === "done").length,
    activeObjectives: linked.filter((objective) => isActiveObjectiveStatus(objective.status))
      .length,
    momentumPercent: linked.length
      ? Math.round((momentumTotal / linked.length) * 100)
      : 0,
  }
}

export function computeAllThemeObjectiveProgress(
  baseline: Record<PdiTheme, number>,
  objectives: ObjectiveEntry[],
  expected: Record<PdiTheme, number>
): Record<PdiTheme, ThemeObjectiveProgress> {
  return Object.fromEntries(
    PDI_THEMES.map((theme) => [
      theme,
      computeThemeObjectiveProgress(theme, baseline, objectives, expected),
    ])
  ) as Record<PdiTheme, ThemeObjectiveProgress>
}

export function computeProjectedPdiLevels(
  baseline: Record<PdiTheme, number>,
  objectives: ObjectiveEntry[],
  expected: Record<PdiTheme, number>
): Record<PdiTheme, number> {
  const progress = computeAllThemeObjectiveProgress(baseline, objectives, expected)
  return Object.fromEntries(
    PDI_THEMES.map((theme) => [theme, progress[theme].projectedLevel])
  ) as Record<PdiTheme, number>
}

export function countThemesWithObjectiveAdvance(
  baseline: Record<PdiTheme, number>,
  objectives: ObjectiveEntry[],
  expected: Record<PdiTheme, number>,
  minDelta = 0.15
): number {
  const progress = computeAllThemeObjectiveProgress(baseline, objectives, expected)
  return PDI_THEMES.filter((theme) => progress[theme].delta >= minDelta).length
}

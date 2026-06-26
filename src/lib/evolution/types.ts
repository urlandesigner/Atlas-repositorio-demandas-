import type { AtuacaoType, ImpactLevel, ImpactScope, RecordEntry } from "@/lib/records/types"
import type { PdiTheme } from "@/lib/profile/pdi"

export type EvidenceStatus = "forte" | "em_evolucao" | "pouco_evidenciado"

export type RecognitionType =
  | "impacto"
  | "colaboracao"
  | "lideranca"
  | "inovacao"
  | "qualidade"
  | "mentoria"
  | "entrega_estrategica"

export type HighlightPeriod = "7d" | "30d" | "90d" | "cycle" | "quarter" | "year"

export type ReportType = "one_on_one" | "promotion"

export interface CompetencyLens {
  id: string
  label: string
  description: string
  themeIds: PdiTheme[]
  /** Níveis-alvo onde esta competência é relevante. */
  targetLevelIds: string[]
}

export interface CompetencyEvidenceView {
  competencyId: string
  label: string
  description: string
  perceivedLevel: number
  expectedLevel: number
  evidenceCount: number
  recentEvidenceCount: number
  status: EvidenceStatus
  linkedRecordIds: string[]
  suggestedNextSteps: string[]
  confidence: "alta" | "media" | "baixa"
}

export interface HighlightFeedItem {
  recordId: string
  title: string
  executiveSummary: string
  atuacao: AtuacaoType
  impactLevel: ImpactLevel
  impactScope: ImpactScope
  tags: string[]
  highlights: string[]
  featuredScore: number
  createdAt: string
  projectName?: string
  record: RecordEntry
}

export interface RecognitionEntry {
  id: string
  title: string
  description: string
  recognizedBy: string
  recognizerArea?: string
  date: string
  type: RecognitionType
  projectId?: string
  projectName?: string
  linkedRecordIds: string[]
  evidenceUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ReportSection {
  id: string
  title: string
  content: string
  source: "ai" | "user" | "baseline"
  linkedRecordIds?: string[]
}

export interface ReportSnapshot {
  id: string
  type: ReportType
  periodStart: string
  periodEnd: string
  sections: ReportSection[]
  generatedAt: string
  lastEditedAt: string
  targetRole?: string
  targetLevelId?: string
}

export const RECOGNITION_TYPE_LABEL: Record<RecognitionType, string> = {
  impacto: "Impacto",
  colaboracao: "Colaboração",
  lideranca: "Liderança",
  inovacao: "Inovação",
  qualidade: "Qualidade",
  mentoria: "Mentoria",
  entrega_estrategica: "Entrega estratégica",
}

export const EVIDENCE_STATUS_LABEL: Record<EvidenceStatus, string> = {
  forte: "Bem evidenciado",
  em_evolucao: "Em construção",
  pouco_evidenciado: "Poucas evidências",
}

export const HIGHLIGHT_PERIOD_LABEL: Record<HighlightPeriod, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  cycle: "Este ciclo",
  quarter: "Este trimestre",
  year: "Este ano",
}

export const ONE_ON_ONE_PERIODS = [
  { id: "7d", label: "Últimos 7 dias", days: 7 },
  { id: "15d", label: "Últimos 15 dias", days: 15 },
  { id: "30d", label: "Últimos 30 dias", days: 30 },
] as const

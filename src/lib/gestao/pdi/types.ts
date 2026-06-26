import { PDI_RUBRIC, PDI_THEMES, PDI_THEME_LABEL } from "@/lib/profile/pdi"
import type { LevelDef } from "@/lib/profile/types"
import { DEFAULT_LADDER } from "@/lib/profile/store"

export interface FrameworkTheme {
  id: string
  label: string
  rubric: string[]
}

export interface PdiFramework {
  id: string
  name: string
  description: string
  areaId: string | null
  managerId: string | null
  ladder: LevelDef[]
  themes: FrameworkTheme[]
  /** levelId → themeId → nível esperado (0–6) */
  expectations: Record<string, Record<string, number>>
  createdAt: string
  updatedAt: string
}

export interface AssignedPdiLevel {
  level: number
  updatedAt: string
}

export interface PdiAssignment {
  id: string
  userId: string
  frameworkId: string
  managerId: string
  currentLevelId: string
  targetLevelId: string | null
  current: Record<string, AssignedPdiLevel>
  cycleLabel: string
  status: "active" | "closed"
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface GestaoPdiData {
  frameworks: PdiFramework[]
  assignments: PdiAssignment[]
  promotionRequests: PdiPromotionRequest[]
}

export type PdiPromotionStatus = "pending" | "approved" | "rejected" | "cancelled"

export interface PdiPromotionRequest {
  id: string
  assignmentId: string
  userId: string
  managerId: string
  areaId: string
  fromLevelId: string
  toLevelId: string
  /** Prontidão no momento da solicitação (0–100) */
  readiness: number
  managerNotes: string | null
  adminNotes: string | null
  status: PdiPromotionStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export const PDI_MAX_LEVEL = 6

export function createDefaultThemes(): FrameworkTheme[] {
  return PDI_THEMES.map((theme) => ({
    id: theme,
    label: PDI_THEME_LABEL[theme],
    rubric: [...PDI_RUBRIC[theme]],
  }))
}

export function clampPdiLevel(value: unknown): number {
  const n = typeof value === "number" ? Math.round(value) : 0
  return Math.max(0, Math.min(n, PDI_MAX_LEVEL))
}

export function getFrameworkExpectations(
  framework: PdiFramework,
  levelId: string
): Record<string, number> {
  const row = framework.expectations[levelId] ?? {}
  return Object.fromEntries(
    framework.themes.map((theme) => [theme.id, clampPdiLevel(row[theme.id])])
  )
}

export function computeFrameworkReadiness(
  current: Record<string, number>,
  expected: Record<string, number>,
  themeIds: string[]
): number {
  if (!themeIds.length) return 0
  const met = themeIds.filter((id) => (current[id] ?? 0) >= (expected[id] ?? 0)).length
  return Math.round((met / themeIds.length) * 100)
}

export function buildDefaultExpectations(
  ladder: LevelDef[],
  themes: FrameworkTheme[],
  template: Record<string, number>[]
): Record<string, Record<string, number>> {
  const expectations: Record<string, Record<string, number>> = {}
  ladder.forEach((level, index) => {
    const row = template[index] ?? template[template.length - 1] ?? {}
    expectations[level.id] = Object.fromEntries(
      themes.map((theme) => [theme.id, clampPdiLevel(row[theme.id] ?? 3)])
    )
  })
  return expectations
}

export function createFrameworkDraft(input: {
  name: string
  description?: string
  areaId?: string | null
  managerId?: string | null
  ladder?: LevelDef[]
  themes?: FrameworkTheme[]
  expectations?: Record<string, Record<string, number>>
}): PdiFramework {
  const timestamp = new Date().toISOString()
  const ladder = input.ladder ?? [...DEFAULT_LADDER]
  const themes = input.themes ?? createDefaultThemes()
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    areaId: input.areaId ?? null,
    managerId: input.managerId ?? null,
    ladder,
    themes,
    expectations:
      input.expectations ??
      buildDefaultExpectations(ladder, themes, [
        { tecnologia: 2, dominio: 2, pessoas: 2, processos: 2, influencia: 1, estudo: 2 },
        { tecnologia: 3, dominio: 3, pessoas: 3, processos: 3, influencia: 2, estudo: 3 },
        { tecnologia: 4, dominio: 3, pessoas: 4, processos: 4, influencia: 3, estudo: 3 },
        { tecnologia: 5, dominio: 4, pessoas: 4, processos: 4, influencia: 3, estudo: 4 },
        { tecnologia: 6, dominio: 5, pessoas: 5, processos: 5, influencia: 5, estudo: 5 },
      ]),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function getLadderLevelIndex(framework: PdiFramework, levelId: string): number {
  return framework.ladder.findIndex((level) => level.id === levelId)
}

export function isHigherLadderLevel(
  framework: PdiFramework,
  fromLevelId: string,
  toLevelId: string
): boolean {
  const from = getLadderLevelIndex(framework, fromLevelId)
  const to = getLadderLevelIndex(framework, toLevelId)
  if (from < 0 || to < 0) return false
  return to > from
}

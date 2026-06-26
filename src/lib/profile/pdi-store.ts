"use client"

import { PDI_MAX_LEVEL, PDI_THEMES, type PdiTheme } from "./pdi"

export const PDI_STORAGE_KEY = "atlas_pdi"
export const PDI_STORAGE_EVENT = "atlas-pdi-change"

export type PdiLevelSource = "ai" | "manual"

export interface PdiThemeState {
  level: number
  source: PdiLevelSource
  /** null quando é uma sugestão da IA ainda não confirmada. */
  confirmedAt: string | null
}

export interface PdiAssessment {
  /** Snapshot congelado do último ciclo formal de PDI. */
  baseline: Record<PdiTheme, PdiThemeState>
  baselineAt: string
  /** Níveis editáveis / sugestões da IA — não substituem o baseline automaticamente. */
  current: Record<PdiTheme, PdiThemeState>
  expected: Record<PdiTheme, number>
  updatedAt: string
}

// Seed com os níveis ATUAIS informados pelo usuário (células coloridas da matriz).
const SEED_CURRENT: Record<PdiTheme, number> = {
  tecnologia: 4,
  dominio: 3,
  pessoas: 4,
  processos: 4,
  influencia: 3,
  estudo: 3,
}

// Nível ESPERADO para Senior 2 — PALPITE a partir das bordas pretas da matriz.
// Ajustável pela rubrica (toque no tema → defina o esperado).
const SEED_EXPECTED: Record<PdiTheme, number> = {
  tecnologia: 6,
  dominio: 5,
  pessoas: 5,
  processos: 5,
  influencia: 5,
  estudo: 6,
}

const LEGACY_EXPECTED_SNAPSHOTS: Array<Record<PdiTheme, number>> = [
  {
    tecnologia: 4,
    dominio: 4,
    pessoas: 5,
    processos: 4,
    influencia: 4,
    estudo: 5,
  },
  {
    tecnologia: 6,
    dominio: 4,
    pessoas: 5,
    processos: 4,
    influencia: 4,
    estudo: 5,
  },
  {
    tecnologia: 6,
    dominio: 5,
    pessoas: 5,
    processos: 4,
    influencia: 4,
    estudo: 5,
  },
  {
    tecnologia: 6,
    dominio: 5,
    pessoas: 5,
    processos: 5,
    influencia: 4,
    estudo: 5,
  },
  {
    tecnologia: 6,
    dominio: 5,
    pessoas: 5,
    processos: 5,
    influencia: 5,
    estudo: 5,
  },
]

const SEED_DATE = "2026-06-10T00:00:00.000Z"

function buildThemeMap(levels: Record<PdiTheme, number>, confirmedAt: string): Record<PdiTheme, PdiThemeState> {
  const map = {} as Record<PdiTheme, PdiThemeState>
  for (const theme of PDI_THEMES) {
    map[theme] = { level: levels[theme], source: "manual", confirmedAt }
  }
  return map
}

function buildSeed(): PdiAssessment {
  const current = buildThemeMap(SEED_CURRENT, SEED_DATE)
  const expected = {} as Record<PdiTheme, number>
  for (const theme of PDI_THEMES) {
    expected[theme] = SEED_EXPECTED[theme]
  }
  return {
    baseline: buildThemeMap(SEED_CURRENT, SEED_DATE),
    baselineAt: SEED_DATE,
    current,
    expected,
    updatedAt: SEED_DATE,
  }
}

export const DEFAULT_PDI = buildSeed()

let cachedRaw: string | null | undefined
let cachedSnapshot: PdiAssessment = DEFAULT_PDI

function clampLevel(value: unknown): number {
  const n = typeof value === "number" ? Math.round(value) : 0
  return Math.max(0, Math.min(n, PDI_MAX_LEVEL))
}

function normalizeThemeState(value: Partial<PdiThemeState> | undefined, fallback: number): PdiThemeState {
  return {
    level: clampLevel(value?.level ?? fallback),
    source: value?.source === "ai" ? "ai" : "manual",
    confirmedAt: typeof value?.confirmedAt === "string" ? value.confirmedAt : null,
  }
}

function normalize(value: Partial<PdiAssessment> | undefined): PdiAssessment {
  const current = {} as Record<PdiTheme, PdiThemeState>
  const baseline = {} as Record<PdiTheme, PdiThemeState>
  const expected = {} as Record<PdiTheme, number>
  const storedExpected = shouldMigrateLegacyExpected(value?.expected)
    ? SEED_EXPECTED
    : value?.expected
  for (const theme of PDI_THEMES) {
    current[theme] = normalizeThemeState(value?.current?.[theme], SEED_CURRENT[theme])
    baseline[theme] = normalizeThemeState(
      value?.baseline?.[theme] ?? value?.current?.[theme],
      current[theme].level
    )
    expected[theme] = clampLevel(storedExpected?.[theme] ?? SEED_EXPECTED[theme])
  }
  return {
    baseline,
    baselineAt: value?.baselineAt ?? value?.updatedAt ?? SEED_DATE,
    current,
    expected,
    updatedAt: value?.updatedAt ?? SEED_DATE,
  }
}

export function getBaselineLevels(assessment: PdiAssessment): Record<PdiTheme, number> {
  return Object.fromEntries(
    PDI_THEMES.map((theme) => [theme, assessment.baseline[theme].level])
  ) as Record<PdiTheme, number>
}

export function getCurrentLevels(assessment: PdiAssessment): Record<PdiTheme, number> {
  return Object.fromEntries(
    PDI_THEMES.map((theme) => [theme, assessment.current[theme].level])
  ) as Record<PdiTheme, number>
}

function shouldMigrateLegacyExpected(value: Partial<Record<PdiTheme, number>> | undefined): boolean {
  if (!value) return false
  return LEGACY_EXPECTED_SNAPSHOTS.some((snapshot) =>
    PDI_THEMES.every((theme) => clampLevel(value[theme]) === snapshot[theme])
  )
}

export function getPdiSnapshot(): PdiAssessment {
  if (typeof window === "undefined") return DEFAULT_PDI
  try {
    const raw = localStorage.getItem(PDI_STORAGE_KEY)
    if (raw === cachedRaw) return cachedSnapshot
    const snapshot = raw ? normalize(JSON.parse(raw) as Partial<PdiAssessment>) : DEFAULT_PDI
    cachedRaw = raw
    cachedSnapshot = snapshot
    return snapshot
  } catch {
    cachedRaw = null
    cachedSnapshot = DEFAULT_PDI
    return cachedSnapshot
  }
}

export function getPdiServerSnapshot(): PdiAssessment {
  return DEFAULT_PDI
}

function save(assessment: PdiAssessment): void {
  if (typeof window === "undefined") return
  const normalized = normalize(assessment)
  const raw = JSON.stringify(normalized)
  localStorage.setItem(PDI_STORAGE_KEY, raw)
  cachedRaw = raw
  cachedSnapshot = normalized
}

export function emitPdiChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(PDI_STORAGE_EVENT))
}

export function subscribePdiStore(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== PDI_STORAGE_KEY) return
    onStoreChange()
  }
  const handleChange = () => onStoreChange()
  window.addEventListener("storage", handleStorage)
  window.addEventListener(PDI_STORAGE_EVENT, handleChange)
  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(PDI_STORAGE_EVENT, handleChange)
  }
}

// ─── Mutações ────────────────────────────────────────────────────────────────

function commit(next: PdiAssessment): void {
  save({ ...next, updatedAt: new Date().toISOString() })
  emitPdiChange()
}

// Define o nível atual de um tema. Toque manual confirma; sugestões da IA ficam
// sem confirmedAt até o usuário confirmar.
export function setCurrentLevel(theme: PdiTheme, level: number, source: PdiLevelSource = "manual"): void {
  const snapshot = getPdiSnapshot()
  commit({
    ...snapshot,
    current: {
      ...snapshot.current,
      [theme]: {
        level: clampLevel(level),
        source,
        confirmedAt: source === "manual" ? new Date().toISOString() : null,
      },
    },
  })
}

export function setExpectedLevel(theme: PdiTheme, level: number): void {
  const snapshot = getPdiSnapshot()
  commit({
    ...snapshot,
    expected: { ...snapshot.expected, [theme]: clampLevel(level) },
  })
}

// Aplica sugestões da IA a todos os temas (origem "ai", aguardando confirmação).
export function applyPdiSuggestions(levels: Record<PdiTheme, number>): void {
  const snapshot = getPdiSnapshot()
  const current = { ...snapshot.current }
  for (const theme of PDI_THEMES) {
    if (levels[theme] === undefined) continue
    current[theme] = { level: clampLevel(levels[theme]), source: "ai", confirmedAt: null }
  }
  commit({ ...snapshot, current })
}

/** Congela os níveis atuais como referência do último PDI formal. */
export function freezePdiBaseline(levels?: Record<PdiTheme, number>): void {
  const snapshot = getPdiSnapshot()
  const source = levels ?? getCurrentLevels(snapshot)
  const now = new Date().toISOString()
  const baseline = {} as Record<PdiTheme, PdiThemeState>
  for (const theme of PDI_THEMES) {
    baseline[theme] = {
      level: clampLevel(source[theme]),
      source: "manual",
      confirmedAt: now,
    }
  }
  commit({ ...snapshot, baseline, baselineAt: now })
}

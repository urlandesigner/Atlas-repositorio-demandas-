"use client"

import type { CareerGoal, LevelDef, ProfileData, ProfileIdentity } from "./types"

export const PROFILE_STORAGE_KEY = "atlas_profile"
export const PROFILE_STORAGE_EVENT = "atlas-profile-change"

export const DEFAULT_LADDER: LevelDef[] = [
  { id: "senior-1", name: "Senior I" },
  { id: "senior-2", name: "Senior II" },
  { id: "senior-3", name: "Senior III" },
  { id: "especialista", name: "Especialista" },
  { id: "lead", name: "Lead" },
]

// Perfil semente — espelha os dados reais do usuário. Serve de ponto de partida
// editável; o impacto e as competências vêm dos registros, não daqui.
const SEED: ProfileData = {
  identity: {
    name: "Urlan Dipré",
    role: "Senior Product Designer II",
    levelId: "senior-2",
    area: "Produto & Design",
    squad: "PRO",
    leader: "",
    startDate: "2025-02-10",
    headline: null,
  },
  goal: {
    targetRole: "Design Lead",
    targetLevelId: "lead",
    targetYear: 2027,
    notes: null,
  },
  ladder: DEFAULT_LADDER,
}

export const DEFAULT_PROFILE = SEED

let cachedProfileRaw: string | null | undefined
let cachedProfileSnapshot: ProfileData = DEFAULT_PROFILE

function normalizeIdentity(value: Partial<ProfileIdentity> | undefined): ProfileIdentity {
  const base = SEED.identity
  return {
    name: value?.name?.trim() || base.name,
    role: value?.role?.trim() || base.role,
    levelId: value?.levelId || base.levelId,
    area: value?.area?.trim() || base.area,
    squad: value?.squad?.trim() || base.squad,
    leader: value?.leader?.trim() ?? base.leader,
    startDate: value?.startDate || base.startDate,
    headline: value?.headline?.trim() || null,
  }
}

function normalizeGoal(value: Partial<CareerGoal> | undefined): CareerGoal {
  const base = SEED.goal
  const year =
    typeof value?.targetYear === "number" && Number.isFinite(value.targetYear)
      ? value.targetYear
      : base.targetYear
  return {
    targetRole: value?.targetRole?.trim() || base.targetRole,
    targetLevelId: value?.targetLevelId || base.targetLevelId,
    targetYear: year,
    notes: value?.notes?.trim() || null,
  }
}

function normalizeLadder(value: unknown): LevelDef[] {
  if (!Array.isArray(value)) return DEFAULT_LADDER
  const levels = value
    .filter((item): item is LevelDef => {
      const level = item as Partial<LevelDef>
      return typeof level?.id === "string" && typeof level?.name === "string"
    })
    .map((level) => ({ id: level.id, name: level.name }))
  return levels.length ? ensureSeniorThreeLevel(levels) : DEFAULT_LADDER
}

function ensureSeniorThreeLevel(levels: LevelDef[]): LevelDef[] {
  if (levels.some((level) => level.id === "senior-3")) return levels

  const seniorTwoIndex = levels.findIndex((level) => level.id === "senior-2")
  if (seniorTwoIndex < 0) return levels

  const next = [...levels]
  next.splice(seniorTwoIndex + 1, 0, { id: "senior-3", name: "Senior III" })
  return next
}

function normalizeProfile(value: Partial<ProfileData> | undefined): ProfileData {
  return {
    identity: normalizeIdentity(value?.identity),
    goal: normalizeGoal(value?.goal),
    ladder: normalizeLadder(value?.ladder),
  }
}

export function getProfileSnapshot(): ProfileData {
  if (typeof window === "undefined") return DEFAULT_PROFILE

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (raw === cachedProfileRaw) return cachedProfileSnapshot

    const snapshot = raw
      ? normalizeProfile(JSON.parse(raw) as Partial<ProfileData>)
      : DEFAULT_PROFILE
    cachedProfileRaw = raw
    cachedProfileSnapshot = snapshot
    return snapshot
  } catch {
    cachedProfileRaw = null
    cachedProfileSnapshot = DEFAULT_PROFILE
    return cachedProfileSnapshot
  }
}

export function getProfileServerSnapshot(): ProfileData {
  return DEFAULT_PROFILE
}

export function saveProfile(data: ProfileData): void {
  if (typeof window === "undefined") return
  const normalized = normalizeProfile(data)
  const raw = JSON.stringify(normalized)
  localStorage.setItem(PROFILE_STORAGE_KEY, raw)
  cachedProfileRaw = raw
  cachedProfileSnapshot = normalized
}

export function emitProfileChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(PROFILE_STORAGE_EVENT))
}

export function subscribeProfileStore(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== PROFILE_STORAGE_KEY) return
    onStoreChange()
  }
  const handleProfileChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(PROFILE_STORAGE_EVENT, handleProfileChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(PROFILE_STORAGE_EVENT, handleProfileChange)
  }
}

// ─── Helpers de leitura ─────────────────────────────────────────────────────

export function findLevel(ladder: LevelDef[], levelId: string): LevelDef | undefined {
  return ladder.find((level) => level.id === levelId)
}

export function levelIndex(ladder: LevelDef[], levelId: string): number {
  return ladder.findIndex((level) => level.id === levelId)
}

// Tempo de empresa em formato "X ano(s) e Y mes(es)" a partir da data de entrada.
export function formatTenure(startDate: string, reference = new Date()): string {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(start.getTime())) return ""

  let months =
    (reference.getFullYear() - start.getFullYear()) * 12 +
    (reference.getMonth() - start.getMonth())
  if (reference.getDate() < start.getDate()) months -= 1
  if (months < 0) months = 0

  const years = Math.floor(months / 12)
  const rest = months % 12

  const yearPart = years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : ""
  const monthPart = rest > 0 ? `${rest} mes${rest > 1 ? "es" : ""}` : ""

  if (yearPart && monthPart) return `${yearPart} e ${monthPart}`
  if (yearPart) return yearPart
  if (monthPart) return monthPart
  return "menos de 1 mês"
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

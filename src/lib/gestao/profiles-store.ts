import {
  emptyBehavioralProfile,
  type BehavioralProfile,
  type GestaoProfilesData,
  type SoftSkillsRadar,
} from "./types"
import { createSoftSkillsRadarFromTemplate } from "@/lib/gestao/soft-skills-template/store"
import { ORG_SEED } from "@/lib/org/seed"
import { getOrgUserById } from "@/lib/org/store"

export const GESTAO_PROFILES_STORAGE_KEY = "atlas_gestao_profiles"
export const GESTAO_PROFILES_STORAGE_EVENT = "atlas-gestao-profiles-change"

const EMPTY: GestaoProfilesData = { behavioral: [], softSkills: [] }

let cached: GestaoProfilesData | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalize(raw: unknown): GestaoProfilesData {
  if (!raw || typeof raw !== "object") return EMPTY
  const data = raw as Partial<GestaoProfilesData>
  return {
    behavioral: Array.isArray(data.behavioral) ? data.behavioral : [],
    softSkills: Array.isArray(data.softSkills) ? data.softSkills : [],
  }
}

function buildSeedProfiles(): GestaoProfilesData {
  const colab = ORG_SEED.users.find((user) => user.id === "user-colab")
  if (!colab) return EMPTY

  const timestamp = "2026-06-01T00:00:00.000Z"
  return {
    behavioral: [
      {
        userId: "user-colab",
        discProfiles: ["executor", "comunicador"],
        strengths: "Entrega consistente, boa comunicação com stakeholders e senso de urgência.",
        attentionPoints: "Pode acelerar demais antes de alinhar riscos técnicos com o time.",
        howToLead: "Metas claras, feedback direto e autonomia com checkpoints curtos.",
        howNotToLead: "Microgerenciamento ou reuniões longas sem decisão.",
        updatedAt: timestamp,
      },
    ],
    softSkills: [
      {
        userId: "user-colab",
        pillars: createSoftSkillsRadarFromTemplate("user-colab", colab.areaId).pillars,
        scores: {
          comunicacao: 4,
          ownership: 5,
          colaboracao: 4,
          adaptabilidade: 3,
          proatividade: 4,
          "inteligencia-emocional": 3,
        },
        updatedAt: timestamp,
      },
    ],
  }
}

export function getGestaoProfilesSnapshot(): GestaoProfilesData {
  if (!isClient()) return buildSeedProfiles()
  if (cached) return cached

  const raw = localStorage.getItem(GESTAO_PROFILES_STORAGE_KEY)
  if (!raw) {
    const seed = buildSeedProfiles()
    localStorage.setItem(GESTAO_PROFILES_STORAGE_KEY, JSON.stringify(seed))
    cached = seed
    return seed
  }

  try {
    cached = normalize(JSON.parse(raw))
    return cached
  } catch {
    cached = EMPTY
    return EMPTY
  }
}

export function getGestaoProfilesServerSnapshot(): GestaoProfilesData {
  return buildSeedProfiles()
}

function save(data: GestaoProfilesData) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(GESTAO_PROFILES_STORAGE_KEY, JSON.stringify(data))
}

export function emitGestaoProfilesChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(GESTAO_PROFILES_STORAGE_EVENT))
}

export function subscribeGestaoProfilesStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(GESTAO_PROFILES_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(GESTAO_PROFILES_STORAGE_EVENT, handler)
  }
}

export function getBehavioralProfile(userId: string): BehavioralProfile {
  const found = getGestaoProfilesSnapshot().behavioral.find(
    (profile) => profile.userId === userId
  )
  return found ?? emptyBehavioralProfile(userId)
}

export function getSoftSkillsRadar(userId: string): SoftSkillsRadar {
  const found = getGestaoProfilesSnapshot().softSkills.find(
    (radar) => radar.userId === userId
  )
  if (found) return found

  const areaId = getOrgUserById(userId)?.areaId ?? null
  return createSoftSkillsRadarFromTemplate(userId, areaId)
}

export function saveBehavioralProfile(profile: BehavioralProfile) {
  const data = getGestaoProfilesSnapshot()
  const next: BehavioralProfile = { ...profile, updatedAt: new Date().toISOString() }
  const index = data.behavioral.findIndex((entry) => entry.userId === profile.userId)
  const behavioral =
    index >= 0
      ? data.behavioral.map((entry, i) => (i === index ? next : entry))
      : [...data.behavioral, next]
  save({ ...data, behavioral })
  emitGestaoProfilesChange()
}

export function saveSoftSkillsRadar(radar: SoftSkillsRadar) {
  const data = getGestaoProfilesSnapshot()
  const next: SoftSkillsRadar = { ...radar, updatedAt: new Date().toISOString() }
  const index = data.softSkills.findIndex((entry) => entry.userId === radar.userId)
  const softSkills =
    index >= 0
      ? data.softSkills.map((entry, i) => (i === index ? next : entry))
      : [...data.softSkills, next]
  save({ ...data, softSkills })
  emitGestaoProfilesChange()
}

export function deleteProfilesForUser(userId: string) {
  const data = getGestaoProfilesSnapshot()
  save({
    behavioral: data.behavioral.filter((entry) => entry.userId !== userId),
    softSkills: data.softSkills.filter((entry) => entry.userId !== userId),
  })
  emitGestaoProfilesChange()
}

export type DiscProfileId = "executor" | "comunicador" | "planejador" | "analista"

export interface DiscProfileDef {
  id: DiscProfileId
  label: string
  shortLabel: string
  description: string
}

export const DISC_PROFILES: DiscProfileDef[] = [
  {
    id: "executor",
    label: "Executor",
    shortLabel: "D",
    description: "Foco em resultados, ritmo e decisão.",
  },
  {
    id: "comunicador",
    label: "Comunicador",
    shortLabel: "I",
    description: "Foco em relações, entusiasmo e influência.",
  },
  {
    id: "planejador",
    label: "Planejador",
    shortLabel: "S",
    description: "Foco em estabilidade, apoio e consistência.",
  },
  {
    id: "analista",
    label: "Analista",
    shortLabel: "C",
    description: "Foco em qualidade, dados e precisão.",
  },
]

export function getDiscProfile(id: DiscProfileId) {
  return DISC_PROFILES.find((profile) => profile.id === id)
}

export interface BehavioralProfile {
  userId: string
  /** Primeiro item = perfil dominante */
  discProfiles: DiscProfileId[]
  strengths: string
  attentionPoints: string
  howToLead: string
  howNotToLead: string
  updatedAt: string
}

export interface SoftSkillPillar {
  id: string
  label: string
}

export interface SoftSkillsRadar {
  userId: string
  pillars: SoftSkillPillar[]
  /** Escala 1–5 por pilar */
  scores: Record<string, number>
  updatedAt: string
}

export interface GestaoProfilesData {
  behavioral: BehavioralProfile[]
  softSkills: SoftSkillsRadar[]
}

export const DEFAULT_SOFT_SKILL_PILLARS: SoftSkillPillar[] = [
  { id: "comunicacao", label: "Comunicação" },
  { id: "ownership", label: "Ownership" },
  { id: "colaboracao", label: "Colaboração" },
  { id: "adaptabilidade", label: "Adaptabilidade" },
  { id: "proatividade", label: "Proatividade" },
  { id: "inteligencia-emocional", label: "Inteligência emocional" },
]

export function defaultSoftSkillsScores(pillars: SoftSkillPillar[]): Record<string, number> {
  return Object.fromEntries(pillars.map((pillar) => [pillar.id, 3]))
}

export function emptyBehavioralProfile(userId: string): BehavioralProfile {
  return {
    userId,
    discProfiles: [],
    strengths: "",
    attentionPoints: "",
    howToLead: "",
    howNotToLead: "",
    updatedAt: new Date().toISOString(),
  }
}

export function emptySoftSkillsRadar(userId: string): SoftSkillsRadar {
  const pillars = DEFAULT_SOFT_SKILL_PILLARS.map((pillar) => ({ ...pillar }))
  return {
    userId,
    pillars,
    scores: defaultSoftSkillsScores(pillars),
    updatedAt: new Date().toISOString(),
  }
}

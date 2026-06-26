import {
  DEFAULT_SOFT_SKILL_PILLARS,
  defaultSoftSkillsScores,
  type SoftSkillPillar,
  type SoftSkillsRadar,
} from "@/lib/gestao/types"

export interface SoftSkillsAreaTemplate {
  areaId: string
  pillars: SoftSkillPillar[]
  updatedAt: string
}

export const SOFT_SKILLS_TEMPLATE_STORAGE_KEY = "atlas_gestao_soft_skills_template"
export const SOFT_SKILLS_TEMPLATE_STORAGE_EVENT = "atlas-gestao-soft-skills-template-change"

let cached: SoftSkillsAreaTemplate[] | null = null

function isClient() {
  return typeof window !== "undefined"
}

function clonePillars(pillars: SoftSkillPillar[]): SoftSkillPillar[] {
  return pillars.map((pillar) => ({ ...pillar }))
}

function defaultTemplateForArea(areaId: string): SoftSkillsAreaTemplate {
  return {
    areaId,
    pillars: clonePillars(DEFAULT_SOFT_SKILL_PILLARS),
    updatedAt: new Date().toISOString(),
  }
}

function normalize(raw: Partial<SoftSkillsAreaTemplate>): SoftSkillsAreaTemplate | null {
  if (!raw.areaId || !Array.isArray(raw.pillars) || raw.pillars.length < 3) return null

  const pillars = raw.pillars
    .filter((pillar) => pillar?.id && pillar?.label?.trim())
    .map((pillar) => ({ id: pillar.id, label: pillar.label.trim() }))

  if (pillars.length < 3) return null

  return {
    areaId: raw.areaId,
    pillars,
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function getSoftSkillsTemplateSnapshot(): SoftSkillsAreaTemplate[] {
  if (!isClient()) return []
  if (cached) return cached

  const raw = localStorage.getItem(SOFT_SKILLS_TEMPLATE_STORAGE_KEY)
  if (!raw) {
    cached = []
    return cached
  }

  try {
    cached = (JSON.parse(raw) as Partial<SoftSkillsAreaTemplate>[])
      .map(normalize)
      .filter((entry): entry is SoftSkillsAreaTemplate => Boolean(entry))
    return cached
  } catch {
    cached = []
    return cached
  }
}

export function getSoftSkillsTemplateServerSnapshot(): SoftSkillsAreaTemplate[] {
  return []
}

function save(data: SoftSkillsAreaTemplate[]) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(SOFT_SKILLS_TEMPLATE_STORAGE_KEY, JSON.stringify(data))
}

export function emitSoftSkillsTemplateChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(SOFT_SKILLS_TEMPLATE_STORAGE_EVENT))
}

export function subscribeSoftSkillsTemplateStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(SOFT_SKILLS_TEMPLATE_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(SOFT_SKILLS_TEMPLATE_STORAGE_EVENT, handler)
  }
}

export function getAreaSoftSkillsTemplate(areaId: string): SoftSkillsAreaTemplate {
  const found = getSoftSkillsTemplateSnapshot().find((entry) => entry.areaId === areaId)
  return found ?? defaultTemplateForArea(areaId)
}

export function getAreaSoftSkillsTemplatePillars(areaId: string | null): SoftSkillPillar[] {
  if (!areaId) return clonePillars(DEFAULT_SOFT_SKILL_PILLARS)
  return clonePillars(getAreaSoftSkillsTemplate(areaId).pillars)
}

export function saveAreaSoftSkillsTemplate(areaId: string, pillars: SoftSkillPillar[]) {
  if (pillars.length < 3) {
    throw new Error("Informe ao menos 3 pilares de soft skills.")
  }

  const data = getSoftSkillsTemplateSnapshot()
  const next: SoftSkillsAreaTemplate = {
    areaId,
    pillars: clonePillars(pillars),
    updatedAt: new Date().toISOString(),
  }
  const index = data.findIndex((entry) => entry.areaId === areaId)
  const templates =
    index >= 0 ? data.map((entry, i) => (i === index ? next : entry)) : [...data, next]
  save(templates)
  emitSoftSkillsTemplateChange()
}

export function createSoftSkillsRadarFromTemplate(
  userId: string,
  areaId: string | null
): SoftSkillsRadar {
  const pillars = getAreaSoftSkillsTemplatePillars(areaId)
  return {
    userId,
    pillars: clonePillars(pillars),
    scores: defaultSoftSkillsScores(pillars),
    updatedAt: new Date().toISOString(),
  }
}

export function applyAreaTemplateToRadar(
  radar: SoftSkillsRadar,
  areaId: string | null
): SoftSkillsRadar {
  const pillars = getAreaSoftSkillsTemplatePillars(areaId)
  const scores = defaultSoftSkillsScores(pillars)

  for (const pillar of pillars) {
    if (radar.scores[pillar.id] !== undefined) {
      scores[pillar.id] = radar.scores[pillar.id]
    }
  }

  return {
    ...radar,
    pillars: clonePillars(pillars),
    scores,
    updatedAt: new Date().toISOString(),
  }
}

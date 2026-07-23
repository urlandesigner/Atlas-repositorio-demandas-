"use client"

export type ObjectiveStatus = "planned" | "in_progress" | "done" | "paused"

export type PdiDimension =
  | "tecnologia"
  | "dominio"
  | "pessoas"
  | "processos"
  | "influencia"
  | "estudo"

export interface ObjectiveEntry {
  id: string
  title: string
  motivation: string | null
  actionPlan: string | null
  expectedEvidence: string | null
  deadline: string | null
  status: ObjectiveStatus
  dimensions: PdiDimension[]
  linkedRecordIds: string[]
  linkedPresentationIds: string[]
  created_at: string
  updated_at: string
}

export interface ObjectiveForm {
  title: string
  motivation: string
  actionPlan: string
  expectedEvidence: string
  deadline: string
  status: ObjectiveStatus
  dimensions: PdiDimension[]
  linkedRecordIds: string[]
  linkedPresentationIds: string[]
}

export const OBJECTIVES_STORAGE_KEY = "atlas_objectives"
export const OBJECTIVES_STORAGE_EVENT = "atlas-objectives-change"

export const OBJECTIVE_STATUS_LABEL: Record<ObjectiveStatus, string> = {
  planned: "Planejado",
  in_progress: "Em andamento",
  done: "Concluído",
  paused: "Pausado",
}

export const OBJECTIVE_STATUS_OPTIONS: ObjectiveStatus[] = [
  "planned",
  "in_progress",
  "done",
  "paused",
]

export const PDI_DIMENSION_LABEL: Record<PdiDimension, string> = {
  tecnologia: "Tecnologia",
  dominio: "Domínio",
  pessoas: "Pessoas",
  processos: "Processos",
  influencia: "Influência",
  estudo: "Estudo",
}

export const PDI_DIMENSION_OPTIONS: PdiDimension[] = [
  "tecnologia",
  "dominio",
  "pessoas",
  "processos",
  "influencia",
  "estudo",
]

export const EMPTY_OBJECTIVE_FORM: ObjectiveForm = {
  title: "",
  motivation: "",
  actionPlan: "",
  expectedEvidence: "",
  deadline: "",
  status: "planned",
  dimensions: [],
  linkedRecordIds: [],
  linkedPresentationIds: [],
}

const SEED: ObjectiveEntry[] = [
  {
    id: "obj1",
    title: "Realizar apresentações para o time de design",
    motivation:
      "Fortalecer referência em Design System, aumentar influência e tornar o conhecimento mais visível para o time.",
    actionPlan:
      "Preparar uma trilha de três apresentações curtas sobre padrões, ferramentas e boas práticas. Agendar uma sessão por mês e registrar feedbacks.",
    expectedEvidence:
      "Materiais apresentados, registros de participação, feedbacks recebidos e mudanças incorporadas ao fluxo do time.",
    deadline: "2026-08-31",
    status: "in_progress",
    dimensions: ["influencia", "tecnologia", "pessoas", "estudo"],
    linkedRecordIds: [],
    linkedPresentationIds: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
]

export const DEFAULT_OBJECTIVES = SEED

let cachedObjectivesRaw: string | null | undefined
let cachedObjectivesSnapshot: ObjectiveEntry[] = DEFAULT_OBJECTIVES

const LEGACY_COMPETENCY_DIMENSIONS: Record<string, PdiDimension[]> = {
  "lideranca-tecnica": ["tecnologia", "pessoas"],
  "influencia-cross": ["influencia"],
  "gestao-stakeholders": ["influencia", "dominio"],
  mentoria: ["pessoas", "estudo"],
  "estrategia-produto": ["dominio", "processos"],
  "comunicacao-executiva": ["influencia", "estudo"],
  "tomada-decisao": ["dominio", "processos"],
  "visao-sistemica": ["dominio", "processos", "tecnologia"],
}

function normalizeStatus(status: ObjectiveStatus | string | null | undefined): ObjectiveStatus {
  return status === "planned" ||
    status === "in_progress" ||
    status === "done" ||
    status === "paused"
    ? status
    : "planned"
}

function normalizeDimensions(value: unknown): PdiDimension[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is PdiDimension =>
    PDI_DIMENSION_OPTIONS.includes(item as PdiDimension)
  )
}

function normalizeLegacyCompetencyDimensions(value: unknown): PdiDimension[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) =>
    typeof item === "string" ? LEGACY_COMPETENCY_DIMENSIONS[item] ?? [] : []
  )
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

function mergeDimensions(...lists: PdiDimension[][]): PdiDimension[] {
  return Array.from(new Set(lists.flat()))
}

function normalizeObjective(entry: Partial<ObjectiveEntry>): ObjectiveEntry {
  const createdAt = entry.created_at ?? new Date().toISOString()
  const legacyCompetencyIds = (entry as Partial<ObjectiveEntry> & { competencyIds?: unknown })
    .competencyIds

  return {
    id: entry.id ?? crypto.randomUUID(),
    title: entry.title?.trim() ?? "",
    motivation: entry.motivation?.trim() || null,
    actionPlan: entry.actionPlan?.trim() || null,
    expectedEvidence: entry.expectedEvidence?.trim() || null,
    deadline: entry.deadline || null,
    status: normalizeStatus(entry.status),
    dimensions: mergeDimensions(
      normalizeDimensions(entry.dimensions),
      normalizeLegacyCompetencyDimensions(legacyCompetencyIds)
    ),
    linkedRecordIds: normalizeStringArray(entry.linkedRecordIds),
    linkedPresentationIds: normalizeStringArray(entry.linkedPresentationIds),
    created_at: createdAt,
    updated_at: entry.updated_at ?? createdAt,
  }
}

export function getObjectivesSnapshot() {
  if (typeof window === "undefined") return DEFAULT_OBJECTIVES

  try {
    const raw = localStorage.getItem(OBJECTIVES_STORAGE_KEY)
    if (raw === cachedObjectivesRaw) return cachedObjectivesSnapshot

    const snapshot = raw
      ? (JSON.parse(raw) as Partial<ObjectiveEntry>[]).map(normalizeObjective)
      : DEFAULT_OBJECTIVES
    cachedObjectivesRaw = raw
    cachedObjectivesSnapshot = snapshot
    return snapshot
  } catch {
    cachedObjectivesRaw = null
    cachedObjectivesSnapshot = DEFAULT_OBJECTIVES
    return cachedObjectivesSnapshot
  }
}

export function getObjectivesServerSnapshot() {
  return DEFAULT_OBJECTIVES
}

export function saveObjectives(data: ObjectiveEntry[]) {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(data)
  localStorage.setItem(OBJECTIVES_STORAGE_KEY, raw)
  cachedObjectivesRaw = raw
  cachedObjectivesSnapshot = data
}

export function emitObjectivesChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(OBJECTIVES_STORAGE_EVENT))
}

export function subscribeObjectivesStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== OBJECTIVES_STORAGE_KEY) return
    onStoreChange()
  }

  const handleObjectivesChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(OBJECTIVES_STORAGE_EVENT, handleObjectivesChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(OBJECTIVES_STORAGE_EVENT, handleObjectivesChange)
  }
}

export function countObjectiveEvidence(
  entry: Pick<ObjectiveEntry, "linkedRecordIds" | "linkedPresentationIds">
) {
  return entry.linkedRecordIds.length + entry.linkedPresentationIds.length
}

export function createObjectiveFromForm(form: ObjectiveForm): ObjectiveEntry {
  const now = new Date().toISOString()
  return normalizeObjective({
    id: crypto.randomUUID(),
    title: form.title,
    motivation: form.motivation,
    actionPlan: form.actionPlan,
    expectedEvidence: form.expectedEvidence,
    deadline: form.deadline || null,
    status: form.status,
    dimensions: form.dimensions,
    linkedRecordIds: form.linkedRecordIds,
    linkedPresentationIds: form.linkedPresentationIds,
    created_at: now,
    updated_at: now,
  })
}

export function createObjectiveForm(entry: ObjectiveEntry): ObjectiveForm {
  return {
    title: entry.title,
    motivation: entry.motivation ?? "",
    actionPlan: entry.actionPlan ?? "",
    expectedEvidence: entry.expectedEvidence ?? "",
    deadline: entry.deadline ?? "",
    status: entry.status,
    dimensions: entry.dimensions,
    linkedRecordIds: entry.linkedRecordIds,
    linkedPresentationIds: entry.linkedPresentationIds,
  }
}

export function addObjectiveToCollection(items: ObjectiveEntry[], entry: ObjectiveEntry) {
  return [entry, ...items]
}

export function updateObjectiveInCollection(
  items: ObjectiveEntry[],
  objectiveId: string,
  form: ObjectiveForm
) {
  return items.map((item) =>
    item.id === objectiveId
      ? normalizeObjective({
          ...item,
          title: form.title,
          motivation: form.motivation,
          actionPlan: form.actionPlan,
          expectedEvidence: form.expectedEvidence,
          deadline: form.deadline || null,
          status: form.status,
          dimensions: form.dimensions,
          linkedRecordIds: form.linkedRecordIds,
          linkedPresentationIds: form.linkedPresentationIds,
          updated_at: new Date().toISOString(),
        })
      : item
  )
}

export function deleteObjectiveFromCollection(items: ObjectiveEntry[], objectiveId: string) {
  return items.filter((item) => item.id !== objectiveId)
}

export function linkRecordToObjective(
  items: ObjectiveEntry[],
  objectiveId: string,
  recordId: string
) {
  return items.map((item) =>
    item.id === objectiveId && !item.linkedRecordIds.includes(recordId)
      ? {
          ...item,
          linkedRecordIds: [...item.linkedRecordIds, recordId],
          updated_at: new Date().toISOString(),
        }
      : item
  )
}

export function unlinkRecordFromObjectives(items: ObjectiveEntry[], recordId: string) {
  return items.map((item) =>
    item.linkedRecordIds.includes(recordId)
      ? {
          ...item,
          linkedRecordIds: item.linkedRecordIds.filter((id) => id !== recordId),
          updated_at: new Date().toISOString(),
        }
      : item
  )
}

import { logAudit } from "@/lib/gestao/audit/store"
import { getUserDisplayName } from "@/lib/gestao/notify-helpers"
import { notifyUser } from "@/lib/notifications/store"
import { getOrgUserById } from "@/lib/org/store"
import {
  OBJECTIVE_STATUS_LABEL,
  PDI_DIMENSION_LABEL,
  PDI_DIMENSION_OPTIONS,
  type ObjectiveStatus,
  type PdiDimension,
} from "@/lib/objectives/store"

export { OBJECTIVE_STATUS_LABEL, PDI_DIMENSION_LABEL, PDI_DIMENSION_OPTIONS }

export interface GestaoObjective {
  id: string
  userId: string
  managerId: string
  title: string
  motivation: string | null
  actionPlan: string | null
  expectedEvidence: string | null
  deadline: string | null
  status: ObjectiveStatus
  dimensions: PdiDimension[]
  createdAt: string
  updatedAt: string
}

export interface GestaoObjectiveForm {
  title: string
  motivation: string
  actionPlan: string
  expectedEvidence: string
  deadline: string
  status: ObjectiveStatus
  dimensions: PdiDimension[]
}

export const EMPTY_GESTAO_OBJECTIVE_FORM: GestaoObjectiveForm = {
  title: "",
  motivation: "",
  actionPlan: "",
  expectedEvidence: "",
  deadline: "",
  status: "planned",
  dimensions: [],
}

export const GESTAO_OBJECTIVES_STORAGE_KEY = "atlas_gestao_objectives"
export const GESTAO_OBJECTIVES_STORAGE_EVENT = "atlas-gestao-objectives-change"

const SEED: GestaoObjective[] = [
  {
    id: "gestao-obj-colab-1",
    userId: "user-colab",
    managerId: "user-gestor",
    title: "Consolidar influência cross-funcional",
    motivation: "Preparar evolução para Senior II com mais visibilidade fora do squad.",
    actionPlan:
      "Liderar 2 iniciativas com stakeholders de Produto e Design; documentar aprendizados em registros.",
    expectedEvidence: "Registros de alinhamento, feedbacks de parceiros e entregas concluídas.",
    deadline: "2026-09-30",
    status: "in_progress",
    dimensions: ["influencia", "pessoas", "dominio"],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
]

let cached: GestaoObjective[] | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalizeStatus(status: unknown): ObjectiveStatus {
  return status === "planned" ||
    status === "in_progress" ||
    status === "done" ||
    status === "paused"
    ? status
    : "planned"
}

function normalizeObjective(raw: Partial<GestaoObjective>): GestaoObjective {
  const createdAt = raw.createdAt ?? new Date().toISOString()
  return {
    id: raw.id ?? crypto.randomUUID(),
    userId: raw.userId ?? "",
    managerId: raw.managerId ?? "",
    title: raw.title?.trim() ?? "",
    motivation: raw.motivation?.trim() || null,
    actionPlan: raw.actionPlan?.trim() || null,
    expectedEvidence: raw.expectedEvidence?.trim() || null,
    deadline: raw.deadline || null,
    status: normalizeStatus(raw.status),
    dimensions: Array.isArray(raw.dimensions)
      ? raw.dimensions.filter((item): item is PdiDimension =>
          PDI_DIMENSION_OPTIONS.includes(item as PdiDimension)
        )
      : [],
    createdAt,
    updatedAt: raw.updatedAt ?? createdAt,
  }
}

export function getGestaoObjectivesSnapshot(): GestaoObjective[] {
  if (!isClient()) return SEED
  if (cached) return cached

  const raw = localStorage.getItem(GESTAO_OBJECTIVES_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(GESTAO_OBJECTIVES_STORAGE_KEY, JSON.stringify(SEED))
    cached = SEED
    return SEED
  }

  try {
    cached = (JSON.parse(raw) as Partial<GestaoObjective>[]).map(normalizeObjective)
    return cached
  } catch {
    cached = SEED
    return SEED
  }
}

export function getGestaoObjectivesServerSnapshot(): GestaoObjective[] {
  return SEED
}

function save(data: GestaoObjective[]) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(GESTAO_OBJECTIVES_STORAGE_KEY, JSON.stringify(data))
}

export function emitGestaoObjectivesChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(GESTAO_OBJECTIVES_STORAGE_EVENT))
}

export function subscribeGestaoObjectivesStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(GESTAO_OBJECTIVES_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(GESTAO_OBJECTIVES_STORAGE_EVENT, handler)
  }
}

export function getObjectivesForUser(userId: string): GestaoObjective[] {
  return getGestaoObjectivesSnapshot().filter((objective) => objective.userId === userId)
}

export function getObjectivesForManager(managerId: string): GestaoObjective[] {
  return getGestaoObjectivesSnapshot().filter((objective) => objective.managerId === managerId)
}

export function createGestaoObjective(input: {
  userId: string
  managerId: string
  form: GestaoObjectiveForm
}): GestaoObjective {
  const now = new Date().toISOString()
  return normalizeObjective({
    id: crypto.randomUUID(),
    userId: input.userId,
    managerId: input.managerId,
    title: input.form.title,
    motivation: input.form.motivation,
    actionPlan: input.form.actionPlan,
    expectedEvidence: input.form.expectedEvidence,
    deadline: input.form.deadline || null,
    status: input.form.status,
    dimensions: input.form.dimensions,
    createdAt: now,
    updatedAt: now,
  })
}

export function upsertGestaoObjective(objective: GestaoObjective, options?: { isNew?: boolean }) {
  const data = getGestaoObjectivesSnapshot()
  const index = data.findIndex((entry) => entry.id === objective.id)
  const isNew = options?.isNew ?? index < 0
  const objectives =
    index >= 0
      ? data.map((entry, i) => (i === index ? objective : entry))
      : [objective, ...data]
  save(objectives)
  emitGestaoObjectivesChange()

  const colab = getOrgUserById(objective.userId)
  const areaId = colab?.areaId ?? ""
  if (areaId) {
    logAudit({
      areaId,
      actorId: objective.managerId,
      action: isNew ? "objective.assigned" : "objective.updated",
      entityType: "gestao_objective",
      entityId: objective.id,
      summary: isNew
        ? `Objetivo "${objective.title}" atribuído a ${colab?.name ?? "colaborador"}.`
        : `Objetivo "${objective.title}" atualizado.`,
    })
  }

  if (isNew) {
    notifyUser({
      userId: objective.userId,
      title: "Novo objetivo do gestor",
      body: objective.title,
      href: "/professional/objectives",
    })
  }
}

export function deleteGestaoObjective(id: string, actorId?: string) {
  const data = getGestaoObjectivesSnapshot()
  const objective = data.find((entry) => entry.id === id)
  save(data.filter((entry) => entry.id !== id))
  emitGestaoObjectivesChange()

  if (objective && actorId) {
    const colab = getOrgUserById(objective.userId)
    const areaId = colab?.areaId ?? ""
    if (areaId) {
      logAudit({
        areaId,
        actorId,
        action: "objective.deleted",
        entityType: "gestao_objective",
        entityId: id,
        summary: `Objetivo "${objective.title}" removido de ${getUserDisplayName(objective.userId)}.`,
      })
    }
  }
}

export function createGestaoObjectiveForm(objective: GestaoObjective): GestaoObjectiveForm {
  return {
    title: objective.title,
    motivation: objective.motivation ?? "",
    actionPlan: objective.actionPlan ?? "",
    expectedEvidence: objective.expectedEvidence ?? "",
    deadline: objective.deadline ?? "",
    status: objective.status,
    dimensions: objective.dimensions,
  }
}

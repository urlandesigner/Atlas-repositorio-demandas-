import { GESTAO_PDI_SEED } from "./seed"
import { logAudit } from "@/lib/gestao/audit/store"
import { getUserDisplayName, notifyAreaAdmins } from "@/lib/gestao/notify-helpers"
import { notifyUser } from "@/lib/notifications/store"
import { getOrgUserById } from "@/lib/org/store"
import {
  clampPdiLevel,
  computeFrameworkReadiness,
  createFrameworkDraft,
  getFrameworkExpectations,
  isHigherLadderLevel,
  type GestaoPdiData,
  type PdiAssignment,
  type PdiFramework,
  type PdiPromotionRequest,
} from "./types"

export const GESTAO_PDI_STORAGE_KEY = "atlas_gestao_pdi"
export const GESTAO_PDI_STORAGE_EVENT = "atlas-gestao-pdi-change"

let cached: GestaoPdiData | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalize(raw: unknown): GestaoPdiData {
  if (!raw || typeof raw !== "object") return GESTAO_PDI_SEED
  const data = raw as Partial<GestaoPdiData>
  return {
    frameworks: Array.isArray(data.frameworks) ? data.frameworks : GESTAO_PDI_SEED.frameworks,
    assignments: Array.isArray(data.assignments) ? data.assignments : GESTAO_PDI_SEED.assignments,
    promotionRequests: Array.isArray(data.promotionRequests)
      ? data.promotionRequests
      : GESTAO_PDI_SEED.promotionRequests,
  }
}

export function getGestaoPdiSnapshot(): GestaoPdiData {
  if (!isClient()) return GESTAO_PDI_SEED
  if (cached) return cached

  const raw = localStorage.getItem(GESTAO_PDI_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(GESTAO_PDI_STORAGE_KEY, JSON.stringify(GESTAO_PDI_SEED))
    cached = GESTAO_PDI_SEED
    return GESTAO_PDI_SEED
  }

  try {
    cached = normalize(JSON.parse(raw))
    return cached
  } catch {
    cached = GESTAO_PDI_SEED
    return GESTAO_PDI_SEED
  }
}

export function getGestaoPdiServerSnapshot(): GestaoPdiData {
  return GESTAO_PDI_SEED
}

function save(data: GestaoPdiData) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(GESTAO_PDI_STORAGE_KEY, JSON.stringify(data))
}

export function emitGestaoPdiChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(GESTAO_PDI_STORAGE_EVENT))
}

export function subscribeGestaoPdiStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(GESTAO_PDI_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(GESTAO_PDI_STORAGE_EVENT, handler)
  }
}

export function getFrameworkById(id: string): PdiFramework | undefined {
  return getGestaoPdiSnapshot().frameworks.find((framework) => framework.id === id)
}

export function getActiveAssignmentForUser(userId: string): PdiAssignment | undefined {
  return getGestaoPdiSnapshot().assignments.find(
    (assignment) => assignment.userId === userId && assignment.status === "active"
  )
}

export function getAssignmentsForManager(managerId: string): PdiAssignment[] {
  return getGestaoPdiSnapshot().assignments.filter(
    (assignment) => assignment.managerId === managerId && assignment.status === "active"
  )
}

export function getAssignmentsForArea(areaId: string, userIds: string[]): PdiAssignment[] {
  const ids = new Set(userIds)
  return getGestaoPdiSnapshot().assignments.filter(
    (assignment) => assignment.status === "active" && ids.has(assignment.userId)
  )
}

export function upsertFramework(framework: PdiFramework) {
  const data = getGestaoPdiSnapshot()
  const index = data.frameworks.findIndex((entry) => entry.id === framework.id)
  const frameworks =
    index >= 0
      ? data.frameworks.map((entry, i) => (i === index ? framework : entry))
      : [...data.frameworks, framework]
  save({ ...data, frameworks })
  emitGestaoPdiChange()
}

export function createFramework(input: Parameters<typeof createFrameworkDraft>[0]) {
  const framework = createFrameworkDraft(input)
  upsertFramework(framework)
  return framework
}

export function duplicateFramework(id: string, managerId: string | null) {
  const source = getFrameworkById(id)
  if (!source) throw new Error("Framework não encontrado.")
  const copy = createFrameworkDraft({
    name: `${source.name} (cópia)`,
    description: source.description,
    areaId: source.areaId,
    managerId,
    ladder: source.ladder.map((level) => ({ ...level })),
    themes: source.themes.map((theme) => ({ ...theme, rubric: [...theme.rubric] })),
    expectations: structuredClone(source.expectations),
  })
  upsertFramework(copy)
  return copy
}

export function deleteFramework(id: string) {
  const data = getGestaoPdiSnapshot()
  const inUse = data.assignments.some(
    (assignment) => assignment.frameworkId === id && assignment.status === "active"
  )
  if (inUse) {
    throw new Error("Framework em uso por PDI ativo. Encerre as atribuições antes de excluir.")
  }
  save({
    ...data,
    frameworks: data.frameworks.filter((framework) => framework.id !== id),
  })
  emitGestaoPdiChange()
}

export function applyPdiToCollaborator(input: {
  userId: string
  frameworkId: string
  managerId: string
  currentLevelId: string
  targetLevelId: string | null
  cycleLabel: string
  notes?: string | null
}): PdiAssignment {
  const framework = getFrameworkById(input.frameworkId)
  if (!framework) throw new Error("Framework não encontrado.")

  const data = getGestaoPdiSnapshot()
  const existing = data.assignments.find(
    (assignment) => assignment.userId === input.userId && assignment.status === "active"
  )
  if (existing) {
    throw new Error("Este colaborador já possui um PDI ativo.")
  }

  const expected = getFrameworkExpectations(framework, input.currentLevelId)
  const timestamp = new Date().toISOString()
  const assignment: PdiAssignment = {
    id: crypto.randomUUID(),
    userId: input.userId,
    frameworkId: input.frameworkId,
    managerId: input.managerId,
    currentLevelId: input.currentLevelId,
    targetLevelId: input.targetLevelId,
    current: Object.fromEntries(
      framework.themes.map((theme) => [
        theme.id,
        { level: expected[theme.id] ?? 0, updatedAt: timestamp },
      ])
    ),
    cycleLabel: input.cycleLabel.trim(),
    status: "active",
    notes: input.notes?.trim() || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  save({ ...data, assignments: [...data.assignments, assignment] })
  emitGestaoPdiChange()

  const colab = getOrgUserById(input.userId)
  const areaId = colab?.areaId ?? ""
  if (areaId) {
    logAudit({
      areaId,
      actorId: input.managerId,
      action: "pdi.applied",
      entityType: "pdi_assignment",
      entityId: assignment.id,
      summary: `PDI "${framework.name}" aplicado a ${colab?.name ?? "colaborador"}.`,
    })
  }
  notifyUser({
    userId: input.userId,
    title: "PDI atribuído",
    body: `Seu gestor aplicou o framework ${framework.name} (${input.cycleLabel}).`,
    href: "/professional/profile",
  })

  return assignment
}

export function updateAssignment(assignment: PdiAssignment) {
  const data = getGestaoPdiSnapshot()
  const index = data.assignments.findIndex((entry) => entry.id === assignment.id)
  if (index < 0) throw new Error("PDI não encontrado.")
  const next = { ...assignment, updatedAt: new Date().toISOString() }
  const assignments = data.assignments.map((entry, i) => (i === index ? next : entry))
  save({ ...data, assignments })
  emitGestaoPdiChange()
}

export function setAssignmentThemeLevel(
  assignmentId: string,
  themeId: string,
  level: number
) {
  const data = getGestaoPdiSnapshot()
  const assignment = data.assignments.find((entry) => entry.id === assignmentId)
  if (!assignment) throw new Error("PDI não encontrado.")
  updateAssignment({
    ...assignment,
    current: {
      ...assignment.current,
      [themeId]: { level: clampPdiLevel(level), updatedAt: new Date().toISOString() },
    },
  })
}

export function closeAssignment(assignmentId: string) {
  const data = getGestaoPdiSnapshot()
  const assignment = data.assignments.find((entry) => entry.id === assignmentId)
  if (!assignment) return
  updateAssignment({ ...assignment, status: "closed" })
}

export function updateAssignmentLevel(assignmentId: string, currentLevelId: string) {
  const assignment = getGestaoPdiSnapshot().assignments.find((entry) => entry.id === assignmentId)
  const framework = assignment ? getFrameworkById(assignment.frameworkId) : undefined
  if (!assignment || !framework) throw new Error("PDI não encontrado.")

  const expected = getFrameworkExpectations(framework, currentLevelId)
  updateAssignment({
    ...assignment,
    currentLevelId,
    current: Object.fromEntries(
      framework.themes.map((theme) => [
        theme.id,
        {
          level: assignment.current[theme.id]?.level ?? expected[theme.id] ?? 0,
          updatedAt: new Date().toISOString(),
        },
      ])
    ),
  })
}

function upsertPromotionRequest(request: PdiPromotionRequest) {
  const data = getGestaoPdiSnapshot()
  const index = data.promotionRequests.findIndex((entry) => entry.id === request.id)
  const promotionRequests =
    index >= 0
      ? data.promotionRequests.map((entry, i) => (i === index ? request : entry))
      : [...data.promotionRequests, request]
  save({ ...data, promotionRequests })
  emitGestaoPdiChange()
}

export function getPendingPromotionForAssignment(
  assignmentId: string
): PdiPromotionRequest | undefined {
  return getGestaoPdiSnapshot().promotionRequests.find(
    (request) => request.assignmentId === assignmentId && request.status === "pending"
  )
}

export function getPromotionRequestsForManager(managerId: string): PdiPromotionRequest[] {
  return getGestaoPdiSnapshot().promotionRequests.filter(
    (request) => request.managerId === managerId
  )
}

export function getPendingPromotionsForArea(areaId: string): PdiPromotionRequest[] {
  return getGestaoPdiSnapshot().promotionRequests.filter(
    (request) => request.areaId === areaId && request.status === "pending"
  )
}

export function submitPromotionRequest(input: {
  assignmentId: string
  managerId: string
  areaId: string
  toLevelId: string
  managerNotes?: string | null
}): PdiPromotionRequest {
  const data = getGestaoPdiSnapshot()
  const assignment = data.assignments.find((entry) => entry.id === input.assignmentId)
  if (!assignment || assignment.status !== "active") {
    throw new Error("PDI ativo não encontrado.")
  }
  if (assignment.managerId !== input.managerId) {
    throw new Error("Sem permissão para solicitar subida neste PDI.")
  }

  const existing = getPendingPromotionForAssignment(input.assignmentId)
  if (existing) {
    throw new Error("Já existe uma solicitação pendente para este PDI.")
  }

  const framework = getFrameworkById(assignment.frameworkId)
  if (!framework) throw new Error("Framework não encontrado.")

  if (!isHigherLadderLevel(framework, assignment.currentLevelId, input.toLevelId)) {
    throw new Error("O nível proposto deve ser superior ao nível atual na trilha.")
  }

  const currentLevels = Object.fromEntries(
    framework.themes.map((theme) => [theme.id, assignment.current[theme.id]?.level ?? 0])
  )
  const expected = getFrameworkExpectations(framework, assignment.currentLevelId)
  const readiness = computeFrameworkReadiness(
    currentLevels,
    expected,
    framework.themes.map((theme) => theme.id)
  )

  const timestamp = new Date().toISOString()
  const request: PdiPromotionRequest = {
    id: crypto.randomUUID(),
    assignmentId: assignment.id,
    userId: assignment.userId,
    managerId: input.managerId,
    areaId: input.areaId,
    fromLevelId: assignment.currentLevelId,
    toLevelId: input.toLevelId,
    readiness,
    managerNotes: input.managerNotes?.trim() || null,
    adminNotes: null,
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  upsertPromotionRequest(request)

  const colabName = getUserDisplayName(assignment.userId)
  const toName =
    framework.ladder.find((level) => level.id === input.toLevelId)?.name ?? input.toLevelId

  logAudit({
    areaId: input.areaId,
    actorId: input.managerId,
    action: "pdi.promotion_submitted",
    entityType: "pdi_promotion",
    entityId: request.id,
    summary: `Subida solicitada para ${colabName}: ${toName}.`,
  })

  notifyAreaAdmins(input.areaId, {
    title: "Nova solicitação de subida",
    body: `${getUserDisplayName(input.managerId)} recomendou subida de ${colabName}.`,
    href: "/admin/pdis",
    excludeUserId: input.managerId,
  })

  return request
}

export function cancelPromotionRequest(requestId: string, managerId: string) {
  const data = getGestaoPdiSnapshot()
  const request = data.promotionRequests.find((entry) => entry.id === requestId)
  if (!request) throw new Error("Solicitação não encontrada.")
  if (request.managerId !== managerId) throw new Error("Sem permissão.")
  if (request.status !== "pending") throw new Error("Só é possível cancelar solicitações pendentes.")

  upsertPromotionRequest({
    ...request,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  })

  logAudit({
    areaId: request.areaId,
    actorId: managerId,
    action: "pdi.promotion_cancelled",
    entityType: "pdi_promotion",
    entityId: request.id,
    summary: `Solicitação de subida cancelada para ${getUserDisplayName(request.userId)}.`,
  })
}

export function approvePromotionRequest(requestId: string, adminId: string, adminNotes?: string) {
  const data = getGestaoPdiSnapshot()
  const request = data.promotionRequests.find((entry) => entry.id === requestId)
  if (!request) throw new Error("Solicitação não encontrada.")
  if (request.status !== "pending") throw new Error("Esta solicitação já foi revisada.")

  updateAssignmentLevel(request.assignmentId, request.toLevelId)

  const timestamp = new Date().toISOString()
  upsertPromotionRequest({
    ...request,
    status: "approved",
    adminNotes: adminNotes?.trim() || null,
    reviewedBy: adminId,
    reviewedAt: timestamp,
    updatedAt: timestamp,
  })

  logAudit({
    areaId: request.areaId,
    actorId: adminId,
    action: "pdi.promotion_approved",
    entityType: "pdi_promotion",
    entityId: request.id,
    summary: `Subida aprovada para ${getUserDisplayName(request.userId)}.`,
  })

  notifyUser({
    userId: request.managerId,
    title: "Subida aprovada",
    body: `A solicitação de ${getUserDisplayName(request.userId)} foi aprovada.`,
    href: `/gestao/liderados/${request.userId}`,
  })
  notifyUser({
    userId: request.userId,
    title: "Evolução na trilha",
    body: "Sua subida no PDI foi aprovada pelo admin de área.",
    href: "/professional/profile",
  })
}

export function rejectPromotionRequest(requestId: string, adminId: string, adminNotes?: string) {
  const data = getGestaoPdiSnapshot()
  const request = data.promotionRequests.find((entry) => entry.id === requestId)
  if (!request) throw new Error("Solicitação não encontrada.")
  if (request.status !== "pending") throw new Error("Esta solicitação já foi revisada.")

  const timestamp = new Date().toISOString()
  upsertPromotionRequest({
    ...request,
    status: "rejected",
    adminNotes: adminNotes?.trim() || null,
    reviewedBy: adminId,
    reviewedAt: timestamp,
    updatedAt: timestamp,
  })

  logAudit({
    areaId: request.areaId,
    actorId: adminId,
    action: "pdi.promotion_rejected",
    entityType: "pdi_promotion",
    entityId: request.id,
    summary: `Subida reprovada para ${getUserDisplayName(request.userId)}.`,
  })

  notifyUser({
    userId: request.managerId,
    title: "Subida reprovada",
    body: `A solicitação de ${getUserDisplayName(request.userId)} foi reprovada.`,
    href: `/gestao/liderados/${request.userId}`,
  })
}

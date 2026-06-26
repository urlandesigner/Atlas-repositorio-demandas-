import type { UserRole } from "@/lib/org/types"
import { getOrgUserById } from "@/lib/org/store"

export type AuditAction =
  | "pdi.applied"
  | "pdi.promotion_submitted"
  | "pdi.promotion_approved"
  | "pdi.promotion_rejected"
  | "pdi.promotion_cancelled"
  | "objective.assigned"
  | "objective.updated"
  | "objective.deleted"
  | "profile.behavioral_updated"
  | "framework.created"
  | "framework.updated"
  | "framework.deleted"
  | "permissions.updated"
  | "soft_skills_template.updated"
  | "export.generated"
  | "user.created"
  | "user.updated"
  | "user.deleted"

export interface AuditEntry {
  id: string
  areaId: string
  actorId: string
  actorRole: UserRole
  actorName: string
  action: AuditAction
  entityType: string
  entityId: string | null
  summary: string
  createdAt: string
}

export const AUDIT_STORAGE_KEY = "atlas_gestao_audit"
export const AUDIT_STORAGE_EVENT = "atlas-gestao-audit-change"

const MAX_ENTRIES = 500

let cached: AuditEntry[] | null = null

function isClient() {
  return typeof window !== "undefined"
}

export function getAuditSnapshot(): AuditEntry[] {
  if (!isClient()) return []
  if (cached) return cached

  const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
  if (!raw) {
    cached = []
    return cached
  }

  try {
    cached = JSON.parse(raw) as AuditEntry[]
    return cached
  } catch {
    cached = []
    return cached
  }
}

export function getAuditServerSnapshot(): AuditEntry[] {
  return []
}

function save(data: AuditEntry[]) {
  if (!isClient()) return
  cached = data.slice(0, MAX_ENTRIES)
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(cached))
}

export function emitAuditChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(AUDIT_STORAGE_EVENT))
}

export function subscribeAuditStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(AUDIT_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(AUDIT_STORAGE_EVENT, handler)
  }
}

export function logAudit(input: {
  areaId: string
  actorId: string
  action: AuditAction
  entityType: string
  entityId?: string | null
  summary: string
}) {
  const actor = getOrgUserById(input.actorId)
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    areaId: input.areaId,
    actorId: input.actorId,
    actorRole: actor?.role ?? "colaborador",
    actorName: actor?.name ?? "Sistema",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    summary: input.summary,
    createdAt: new Date().toISOString(),
  }

  save([entry, ...getAuditSnapshot()])
  emitAuditChange()
}

export function getAuditForArea(areaId: string): AuditEntry[] {
  return getAuditSnapshot().filter((entry) => entry.areaId === areaId)
}

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  "pdi.applied": "PDI aplicado",
  "pdi.promotion_submitted": "Subida solicitada",
  "pdi.promotion_approved": "Subida aprovada",
  "pdi.promotion_rejected": "Subida reprovada",
  "pdi.promotion_cancelled": "Subida cancelada",
  "objective.assigned": "Objetivo atribuído",
  "objective.updated": "Objetivo atualizado",
  "objective.deleted": "Objetivo removido",
  "profile.behavioral_updated": "Perfil DISC atualizado",
  "framework.created": "Framework criado",
  "framework.updated": "Framework atualizado",
  "framework.deleted": "Framework removido",
  "permissions.updated": "Permissões atualizadas",
  "soft_skills_template.updated": "Template soft skills",
  "export.generated": "Exportação gerada",
  "user.created": "Colaborador cadastrado",
  "user.updated": "Colaborador atualizado",
  "user.deleted": "Colaborador removido",
}

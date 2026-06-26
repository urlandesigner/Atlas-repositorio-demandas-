import type { UserRole } from "@/lib/org/types"

export interface AreaPermissions {
  areaId: string
  /** Colaborador vê perfil DISC no Meu Perfil */
  collaboratorCanViewDisc: boolean
  /** Colaborador vê radar de soft skills (avaliação do gestor) */
  collaboratorCanViewSoftSkills: boolean
  /** Colaborador vê orientações de liderança (como liderar / como não liderar) */
  collaboratorCanViewHowToLead: boolean
  /** Gestor pode criar/editar frameworks de PDI */
  gestorCanEditFrameworks: boolean
  /** Gestor pode editar o template de soft skills da área */
  gestorCanEditSoftSkillsTemplate: boolean
  updatedAt: string
}

export const PERMISSIONS_STORAGE_KEY = "atlas_gestao_permissions"
export const PERMISSIONS_STORAGE_EVENT = "atlas-gestao-permissions-change"

export const DEFAULT_PERMISSION_FLAGS = {
  collaboratorCanViewDisc: false,
  collaboratorCanViewSoftSkills: false,
  collaboratorCanViewHowToLead: false,
  gestorCanEditFrameworks: true,
  gestorCanEditSoftSkillsTemplate: true,
} as const

let cached: AreaPermissions[] | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalize(raw: Partial<AreaPermissions>): AreaPermissions {
  const timestamp = raw.updatedAt ?? new Date().toISOString()
  return {
    areaId: raw.areaId ?? "",
    collaboratorCanViewDisc: Boolean(raw.collaboratorCanViewDisc),
    collaboratorCanViewSoftSkills: Boolean(raw.collaboratorCanViewSoftSkills),
    collaboratorCanViewHowToLead: Boolean(raw.collaboratorCanViewHowToLead),
    gestorCanEditFrameworks: raw.gestorCanEditFrameworks !== false,
    gestorCanEditSoftSkillsTemplate: raw.gestorCanEditSoftSkillsTemplate !== false,
    updatedAt: timestamp,
  }
}

export function getPermissionsSnapshot(): AreaPermissions[] {
  if (!isClient()) return []
  if (cached) return cached

  const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY)
  if (!raw) {
    cached = []
    return cached
  }

  try {
    cached = (JSON.parse(raw) as Partial<AreaPermissions>[]).map(normalize)
    return cached
  } catch {
    cached = []
    return cached
  }
}

export function getPermissionsServerSnapshot(): AreaPermissions[] {
  return []
}

function save(data: AreaPermissions[]) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(data))
}

export function emitPermissionsChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(PERMISSIONS_STORAGE_EVENT))
}

export function subscribePermissionsStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(PERMISSIONS_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(PERMISSIONS_STORAGE_EVENT, handler)
  }
}

export function getAreaPermissions(areaId: string): AreaPermissions {
  const found = getPermissionsSnapshot().find((entry) => entry.areaId === areaId)
  if (found) return found

  return {
    areaId,
    ...DEFAULT_PERMISSION_FLAGS,
    updatedAt: new Date().toISOString(),
  }
}

export function saveAreaPermissions(
  areaId: string,
  flags: Omit<AreaPermissions, "areaId" | "updatedAt">
) {
  const data = getPermissionsSnapshot()
  const next: AreaPermissions = {
    areaId,
    ...flags,
    updatedAt: new Date().toISOString(),
  }
  const index = data.findIndex((entry) => entry.areaId === areaId)
  const permissions =
    index >= 0 ? data.map((entry, i) => (i === index ? next : entry)) : [...data, next]
  save(permissions)
  emitPermissionsChange()
}

export function canGestorEditFrameworks(areaId: string, role: UserRole): boolean {
  if (role === "admin") return true
  if (role !== "gestor") return false
  return getAreaPermissions(areaId).gestorCanEditFrameworks
}

export function canGestorEditSoftSkillsTemplate(areaId: string, role: UserRole): boolean {
  if (role === "admin") return true
  if (role !== "gestor") return false
  return getAreaPermissions(areaId).gestorCanEditSoftSkillsTemplate
}

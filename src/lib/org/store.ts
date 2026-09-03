import { ORG_SEED } from "./seed"
import {
  marcarVersao,
  precisaRessincronizar,
  registrarOferecidos,
  unirPorId,
} from "@/lib/seed-sync"
import type { CollaboratorKind, OrgArea, OrgData, OrgUser, UserRole } from "./types"

export const ORG_STORAGE_KEY = "atlas_org"
export const ORG_STORAGE_EVENT = "atlas-org-change"

let cached: OrgData | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalizeOrg(raw: unknown): OrgData {
  if (!raw || typeof raw !== "object") return ORG_SEED
  const data = raw as Partial<OrgData>
  return {
    areas: Array.isArray(data.areas) ? data.areas : ORG_SEED.areas,
    users: Array.isArray(data.users) ? data.users : ORG_SEED.users,
  }
}

/**
 * Versão do conteúdo de seed do org. Suba um ao corrigir usuário ou área do
 * seed que precise alcançar quem já tem snapshot salvo.
 *
 * Este store foi a causa concreta do mural de reconhecimentos aparecer vazio:
 * os kudos apontavam para usuários do seed que o snapshot antigo de quem já usa
 * o app não continha, e o filtro do mural descartava todos.
 *
 * Custo declarado: ao subir a versão, usuário ou área do seed que tenha sido
 * EDITADO pelo app volta ao valor do seed. Quem foi criado pelo app tem id
 * próprio e não é tocado; quem foi apagado continua apagado.
 */
const ORG_SEED_VERSAO = "1"
const ORG_VERSAO_KEY = "atlas_org_versao"
const ORG_OFERECIDOS_KEY = "atlas_org_seed_oferecidos"

const idsDoSeedOrg = () => [
  ...ORG_SEED.areas.map((area) => area.id),
  ...ORG_SEED.users.map((user) => user.id),
]

export function getOrgSnapshot(): OrgData {
  if (!isClient()) return ORG_SEED
  if (cached) return cached

  const raw = localStorage.getItem(ORG_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(ORG_SEED))
    registrarOferecidos(idsDoSeedOrg(), ORG_OFERECIDOS_KEY)
    marcarVersao(ORG_VERSAO_KEY, ORG_SEED_VERSAO)
    cached = ORG_SEED
    return ORG_SEED
  }

  try {
    const salvo = normalizeOrg(JSON.parse(raw))
    if (precisaRessincronizar(ORG_VERSAO_KEY, ORG_SEED_VERSAO)) {
      const unido: OrgData = {
        areas: unirPorId(salvo.areas, ORG_SEED.areas, ORG_OFERECIDOS_KEY),
        users: unirPorId(salvo.users, ORG_SEED.users, ORG_OFERECIDOS_KEY),
      }
      try {
        localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(unido))
      } catch {
        // Vale para esta sessão.
      }
      cached = unido
      return unido
    }
    cached = salvo
    return cached
  } catch {
    cached = ORG_SEED
    return ORG_SEED
  }
}

export function getOrgServerSnapshot(): OrgData {
  return ORG_SEED
}

export function saveOrg(data: OrgData) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(data))
}

export function emitOrgChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(ORG_STORAGE_EVENT))
}

export function subscribeOrgStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(ORG_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(ORG_STORAGE_EVENT, handler)
  }
}

export function getOrgUserById(id: string): OrgUser | undefined {
  return getOrgSnapshot().users.find((user) => user.id === id)
}

export function getOrgUserByEmail(email: string): OrgUser | undefined {
  const normalized = email.trim().toLowerCase()
  return getOrgSnapshot().users.find((user) => user.email === normalized)
}

export function getAreaById(id: string): OrgArea | undefined {
  return getOrgSnapshot().areas.find((area) => area.id === id)
}

export function getDirectReports(managerId: string): OrgUser[] {
  return getOrgSnapshot().users.filter((user) => user.managerId === managerId)
}

export function getManagersByArea(areaId: string): OrgUser[] {
  return getOrgSnapshot().users.filter(
    (user) => user.areaId === areaId && user.role === "gestor"
  )
}

export function upsertOrgUser(user: OrgUser) {
  const data = getOrgSnapshot()
  const index = data.users.findIndex((entry) => entry.id === user.id)
  const users =
    index >= 0
      ? data.users.map((entry, i) => (i === index ? user : entry))
      : [...data.users, user]
  saveOrg({ ...data, users })
  emitOrgChange()
}

export function createOrgUser(input: {
  email: string
  name: string
  role: UserRole
  areaId: string | null
  kind: CollaboratorKind | null
  managementTitle: string | null
  managerId: string | null
}): OrgUser {
  const normalizedEmail = input.email.trim().toLowerCase()
  const existing = getOrgUserByEmail(normalizedEmail)
  if (existing) {
    throw new Error("Já existe um usuário com este email.")
  }

  const timestamp = new Date().toISOString()
  const user: OrgUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    name: input.name.trim(),
    role: input.role,
    areaId: input.areaId,
    kind: input.kind,
    managementTitle: input.managementTitle,
    managerId: input.managerId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  upsertOrgUser(user)
  return user
}

export function updateOrgUser(
  id: string,
  updates: Partial<
    Pick<
      OrgUser,
      "email" | "name" | "kind" | "managementTitle" | "role" | "areaId" | "managerId"
    >
  >
): OrgUser {
  const current = getOrgUserById(id)
  if (!current) {
    throw new Error("Colaborador não encontrado.")
  }

  const nextEmail = updates.email?.trim().toLowerCase() ?? current.email
  const duplicate = getOrgUserByEmail(nextEmail)
  if (duplicate && duplicate.id !== id) {
    throw new Error("Já existe um usuário com este email.")
  }

  const user: OrgUser = {
    ...current,
    ...updates,
    email: nextEmail,
    name: updates.name?.trim() ?? current.name,
    updatedAt: new Date().toISOString(),
  }
  upsertOrgUser(user)
  return user
}

export function deleteOrgUser(id: string) {
  const data = getOrgSnapshot()
  saveOrg({
    ...data,
    users: data.users.filter((user) => user.id !== id),
  })
  emitOrgChange()
}

export function listCollaboratorsForManager(managerId: string) {
  return getDirectReports(managerId).filter((user) => user.role === "colaborador")
}

export function listUsersInArea(areaId: string) {
  return getOrgSnapshot().users.filter((user) => user.areaId === areaId)
}

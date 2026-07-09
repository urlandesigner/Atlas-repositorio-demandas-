import type { OrgData, OrgUser } from "./types"

export type OrgPublicPerson = {
  id: string
  name: string
  avatarUrl?: string | null
  title: string
  areaName: string
  teamLabel: string
  managerName: string
  managerId: string | null
  reportCount: number
}

export function getOrgUserRoleLabel(user: OrgUser): string {
  if (user.role === "admin") return "Administrador"
  if (user.role === "gestor") return "Gestor"
  if (user.kind === "gestao") return "Gestão / Coordenação"
  return "Colaborador"
}

export function getOrgUserDisplayTitle(user: OrgUser): string {
  return user.managementTitle?.trim() || getOrgUserRoleLabel(user)
}

export function getOrgPublicPerson(org: OrgData, user: OrgUser): OrgPublicPerson {
  const areaName =
    org.areas.find((area) => area.id === user.areaId)?.name ?? "Setor não definido"
  const manager = user.managerId ? org.users.find((entry) => entry.id === user.managerId) : null
  const reportCount = org.users.filter((entry) => entry.managerId === user.id).length

  let teamLabel = "Não definido"

  if (reportCount > 0) {
    teamLabel = reportCount === 1 ? "1 pessoa no time" : `${reportCount} pessoas no time`
  } else if (manager) {
    teamLabel = `Time de ${manager.name}`
  } else if (user.areaId) {
    teamLabel = `Base de ${areaName}`
  }

  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    title: getOrgUserDisplayTitle(user),
    areaName,
    teamLabel,
    managerName: manager?.name ?? "Sem gestor definido",
    managerId: manager?.id ?? null,
    reportCount,
  }
}

export function buildOrgPublicSearchText(person: OrgPublicPerson) {
  return [
    person.name,
    person.title,
    person.areaName,
    person.teamLabel,
    person.managerName,
  ]
    .join(" ")
    .toLowerCase()
}

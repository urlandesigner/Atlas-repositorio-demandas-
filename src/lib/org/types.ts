export type UserRole = "colaborador" | "gestor" | "admin"

/** Tipo no cadastro: liderança vs IC */
export type CollaboratorKind = "gestao" | "colaborador"

export interface OrgArea {
  id: string
  name: string
  createdAt: string
}

export interface OrgUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  role: UserRole
  areaId: string | null
  /** Legado/display — use `role: gestor` para líderes com painel de gestão */
  kind: CollaboratorKind | null
  /** Cargo livre: Head, Coordenador, Supervisor… */
  managementTitle: string | null
  /** Gestor imediato */
  managerId: string | null
  createdAt: string
  updatedAt: string
}

export interface OrgData {
  areas: OrgArea[]
  users: OrgUser[]
}

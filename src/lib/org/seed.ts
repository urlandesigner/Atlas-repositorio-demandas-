import type { OrgData } from "./types"

const now = "2026-06-01T00:00:00.000Z"

export const ORG_SEED: OrgData = {
  areas: [
    {
      id: "area-tecnologia",
      name: "Tecnologia",
      createdAt: now,
    },
  ],
  users: [
    {
      id: "user-admin",
      email: "admin@atlas.com",
      name: "Admin Tecnologia",
      role: "admin",
      areaId: "area-tecnologia",
      kind: "gestao",
      managementTitle: "Head de Área",
      managerId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-gestor",
      email: "gestor@atlas.com",
      name: "Gestor Imediato",
      role: "gestor",
      areaId: "area-tecnologia",
      kind: "gestao",
      managementTitle: "Coordenador",
      managerId: "user-admin",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-colab",
      email: "colaborador@atlas.com",
      name: "Colaborador Demo",
      role: "colaborador",
      areaId: "area-tecnologia",
      kind: "colaborador",
      managementTitle: null,
      managerId: "user-gestor",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-colab-2",
      email: "maria@atlas.com",
      name: "Maria Silva",
      role: "colaborador",
      areaId: "area-tecnologia",
      kind: "colaborador",
      managementTitle: null,
      managerId: "user-gestor",
      createdAt: now,
      updatedAt: now,
    },
  ],
}

import { createFrameworkDraft, type GestaoPdiData, type PdiFramework } from "./types"
import { DEFAULT_LADDER } from "@/lib/profile/store"

const now = "2026-06-01T00:00:00.000Z"

const ENGINEERING_FRAMEWORK_ID = "framework-engineering"
const PRODUCT_FRAMEWORK_ID = "framework-product"

export const ENGINEERING_FRAMEWORK: PdiFramework = {
  ...createFrameworkDraft({
    name: "Engineering Ladder",
    description: "Framework padrão para trilha de engenharia e tech lead.",
    areaId: "area-tecnologia",
    managerId: null,
  }),
  id: ENGINEERING_FRAMEWORK_ID,
  createdAt: now,
  updatedAt: now,
}

export const PRODUCT_FRAMEWORK: PdiFramework = {
  ...createFrameworkDraft({
    name: "Trilha de Produto & Design",
    description: "Trilha adaptada para Produto & Design — ênfase em domínio e influência.",
    areaId: "area-tecnologia",
    managerId: null,
    ladder: [
      { id: "pleno-1", name: "Pleno I" },
      { id: "pleno-2", name: "Pleno II" },
      { id: "senior-1", name: "Senior I" },
      { id: "senior-2", name: "Senior II" },
      { id: "staff", name: "Staff" },
      { id: "lead", name: "Lead" },
    ],
    expectations: undefined,
  }),
  id: PRODUCT_FRAMEWORK_ID,
  createdAt: now,
  updatedAt: now,
}

// Sobrescreve expectativas do Product com curva mais forte em domínio/influência
PRODUCT_FRAMEWORK.expectations = {
  "pleno-1": { tecnologia: 2, dominio: 3, pessoas: 2, processos: 2, influencia: 1, estudo: 2 },
  "pleno-2": { tecnologia: 3, dominio: 4, pessoas: 3, processos: 3, influencia: 2, estudo: 3 },
  "senior-1": { tecnologia: 4, dominio: 4, pessoas: 4, processos: 4, influencia: 3, estudo: 3 },
  "senior-2": { tecnologia: 5, dominio: 5, pessoas: 4, processos: 4, influencia: 4, estudo: 4 },
  staff: { tecnologia: 5, dominio: 6, pessoas: 5, processos: 5, influencia: 5, estudo: 5 },
  lead: { tecnologia: 6, dominio: 6, pessoas: 6, processos: 5, influencia: 6, estudo: 5 },
}

export const GESTAO_PDI_SEED: GestaoPdiData = {
  frameworks: [ENGINEERING_FRAMEWORK, PRODUCT_FRAMEWORK],
  assignments: [
    {
      id: "assignment-colab-demo",
      userId: "user-colab",
      frameworkId: PRODUCT_FRAMEWORK_ID,
      managerId: "user-gestor",
      currentLevelId: "senior-1",
      targetLevelId: "senior-2",
      current: {
        tecnologia: { level: 4, updatedAt: now },
        dominio: { level: 4, updatedAt: now },
        pessoas: { level: 3, updatedAt: now },
        processos: { level: 4, updatedAt: now },
        influencia: { level: 3, updatedAt: now },
        estudo: { level: 3, updatedAt: now },
      },
      cycleLabel: "2026 · H1",
      status: "active",
      notes: "PDI aplicado pelo gestor no ciclo atual.",
      createdAt: now,
      updatedAt: now,
    },
  ],
  promotionRequests: [
    {
      id: "promotion-colab-demo",
      assignmentId: "assignment-colab-demo",
      userId: "user-colab",
      managerId: "user-gestor",
      areaId: "area-tecnologia",
      fromLevelId: "senior-1",
      toLevelId: "senior-2",
      readiness: 67,
      managerNotes:
        "Colaborador atingiu consistência nas competências do nível atual. Recomendo subida para Senior II.",
      adminNotes: null,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
}

export { ENGINEERING_FRAMEWORK_ID, PRODUCT_FRAMEWORK_ID }

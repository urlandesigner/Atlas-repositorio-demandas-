import { createFrameworkDraft, type GestaoPdiData, type PdiFramework } from "./types"
import { DEFAULT_LADDER } from "@/lib/profile/store"
import { PDI_DESIGN_2026_H1 } from "./seed-pdi-design-2026"

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
  // Linha do Senior II vinda do relatório de PDI de janeiro/2026, onde cada
  // tema aparece como par `(+Nx, -Ny)`: o segundo número é o nível esperado.
  //
  //   TECNOLOGIA (+N5, -N6) -> 6      PROCESSOS  (+N4, -N5) -> 5
  //   DOMÍNIO    (+N3, -N4) -> 4      INFLUÊNCIA (+N3, -N4) -> 4
  //   PESSOAS    (+N4, -N5) -> 5      ESTUDA     (+N5, -N6) -> 6
  //
  // Preferi o relatório à leitura das bordas da tabela de rubrica: o PDF é
  // texto, a borda é pixel, e eu já errei uma vez interpretando esses pares.
  "senior-2": { tecnologia: 6, dominio: 4, pessoas: 5, processos: 5, influencia: 4, estudo: 6 },
  staff: { tecnologia: 5, dominio: 6, pessoas: 5, processos: 5, influencia: 5, estudo: 5 },
  lead: { tecnologia: 6, dominio: 6, pessoas: 6, processos: 5, influencia: 6, estudo: 5 },
}

export const GESTAO_PDI_SEED: GestaoPdiData = {
  frameworks: [ENGINEERING_FRAMEWORK, PRODUCT_FRAMEWORK],
  assignments: [
    PDI_DESIGN_2026_H1,
    {
      id: "assignment-colab-demo",
      userId: "user-colab",
      frameworkId: PRODUCT_FRAMEWORK_ID,
      managerId: "user-gestor",
      // Senior II nos dois ciclos, informado pelo avaliado. Estava em senior-1,
      // e isso mudava o denominador de cada tema: as expectativas saíam da
      // linha errada da tabela.
      currentLevelId: "senior-2",
      targetLevelId: "senior-2",
      // Níveis do PDI de janeiro/2026, informados pelo próprio avaliado.
      //
      // Domínio e Pessoas estavam trocados aqui — 4 e 3 em vez de 3 e 4 — e o
      // dado se contradizia dentro do próprio store: `evaluation.previous` do
      // PDI Design 2026, que registra o ponto de partida daquele ciclo, sempre
      // trouxe 3 e 4. Os dois agora batem, e o delta por tema do ciclo atual
      // (+1 em Tecnologia, Domínio, Influência e Estudo) fecha com os dois.
      current: {
        tecnologia: { level: 4, updatedAt: now },
        dominio: { level: 3, updatedAt: now },
        pessoas: { level: 4, updatedAt: now },
        processos: { level: 4, updatedAt: now },
        influencia: { level: 3, updatedAt: now },
        estudo: { level: 3, updatedAt: now },
      },
      cycleLabel: "2026 · H1",
      status: "closed",
      notes: "Ciclo anterior ao PDI Design consolidado.",
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

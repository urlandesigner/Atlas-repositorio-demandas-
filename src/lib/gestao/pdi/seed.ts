import { createFrameworkDraft, type GestaoPdiData, type PdiFramework } from "./types"
import { DEFAULT_LADDER } from "@/lib/profile/store"
import { PDI_DESIGN_2026_H1 } from "./seed-pdi-design-2026"

const now = "2026-06-01T00:00:00.000Z"

/* Data do ciclo 2026 · H1: seis meses antes da avaliacao do PDI Design
   (24/08/2026), que e o ciclo seguinte. Estava usando o `now` genarico do seed,
   entao o ciclo "anterior" aparecia a dois meses e meio do outro — perto demais
   para dois semestres.

   Ao MEIO-DIA e nao a meia-noite, de proposito: meia-noite UTC volta um dia em
   fuso negativo, e ja mordeu esta data uma vez (rendia 31/05 com 01/06
   gravado). A tela agora formata em UTC e nao dependeria disso, mas gravar ao
   meio-dia protege qualquer outro leitor do mesmo registro. */
const CICLO_H1 = "2026-02-24T12:00:00.000Z"

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
      { id: "senior-3", name: "Senior III" },
      { id: "staff", name: "Staff" },
      { id: "lead", name: "Lead" },
    ],
    expectations: undefined,
  }),
  id: PRODUCT_FRAMEWORK_ID,
  createdAt: now,
  updatedAt: now,
}

// Sobrescreve expectativas do Product com curva mais forte em domínio/influência.
//
// Nota sobre o teto: a escala da rubrica é 0–6, e o Senior III já exige 6 em
// quatro dos seis temas. Sobra pouco espaço para Staff e Lead se distinguirem
// por estes temas — hoje Lead difere de Senior III só em Pessoas. Não é defeito
// desta tabela e sim consequência de a escala terminar antes da escada; resolver
// pediria temas próprios para os níveis de cima, o que é decisão de produto.
PRODUCT_FRAMEWORK.expectations = {
  "pleno-1": { tecnologia: 2, dominio: 3, pessoas: 2, processos: 2, influencia: 1, estudo: 2 },
  "pleno-2": { tecnologia: 3, dominio: 4, pessoas: 3, processos: 3, influencia: 2, estudo: 3 },
  "senior-1": { tecnologia: 4, dominio: 4, pessoas: 4, processos: 4, influencia: 3, estudo: 3 },
  // Nível esperado do Senior II em cada tema, informado pelo avaliado.
  //
  // Não derivar isto de novo por leitura indireta. Foram duas tentativas e a
  // segunda piorou: os badges SÊNIOR II da tabela de rubrica davam
  // {6,5,5,5,5,6}, que estava certo, e eu troquei por {6,4,5,5,4,6} lendo o
  // segundo número dos pares `(+Nx, -Ny)` do relatório de janeiro. Havia um
  // sinal de que a interpretação estava errada e eu não o segui: o primeiro
  // número do par já não correspondia ao nível atual em Tecnologia e Estudo.
  "senior-2": { tecnologia: 6, dominio: 5, pessoas: 5, processos: 5, influencia: 5, estudo: 6 },
  // Senior III, dos badges SÊNIOR III da tabela de rubrica.
  "senior-3": { tecnologia: 6, dominio: 6, pessoas: 5, processos: 5, influencia: 6, estudo: 6 },
  // Staff e Lead subiram onde ficariam ABAIXO do Senior III — em tecnologia,
  // influência e estudo a barra caía de 6 para 5 ao subir de nível, e uma meta
  // que diminui com a promoção não é meta. Ver a nota sobre o teto acima.
  staff: { tecnologia: 6, dominio: 6, pessoas: 5, processos: 5, influencia: 6, estudo: 6 },
  lead: { tecnologia: 6, dominio: 6, pessoas: 6, processos: 5, influencia: 6, estudo: 6 },
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
      createdAt: CICLO_H1,
      updatedAt: CICLO_H1,
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

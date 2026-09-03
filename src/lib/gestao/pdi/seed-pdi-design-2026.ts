import type { PdiAssignment } from "./types"

/**
 * PDI Design · 2026, avaliado em 24/08/2026.
 *
 * Em arquivo próprio porque é volumoso — seis justificativas longas e catorze
 * dimensões comportamentais — e misturado ao seed.ts esconderia a estrutura do
 * seed, que é curta.
 *
 * `evaluation.previous` guarda o ponto de partida de cada tema neste ciclo, em
 * vez de a tela derivar isso do ciclo anterior do store. É o número que o gestor
 * registrou, e vale mesmo quando não existe ciclo anterior salvo, quando o
 * anterior usou outro framework, ou quando a pessoa tem só este.
 */
export const PDI_DESIGN_2026_H1: PdiAssignment = {
  id: "assignment-colab-pdi-design-2026h1",
  userId: "user-colab",
  frameworkId: "framework-product",
  managerId: "user-gestor",
  currentLevelId: "senior-2",
  targetLevelId: "staff",
  current: {
    tecnologia: { level: 5, updatedAt: "2026-08-24T12:00:00.000Z" },
    dominio: { level: 4, updatedAt: "2026-08-24T12:00:00.000Z" },
    pessoas: { level: 4, updatedAt: "2026-08-24T12:00:00.000Z" },
    processos: { level: 4, updatedAt: "2026-08-24T12:00:00.000Z" },
    influencia: { level: 4, updatedAt: "2026-08-24T12:00:00.000Z" },
    estudo: { level: 4, updatedAt: "2026-08-24T12:00:00.000Z" },
  },
  cycleLabel: "PDI Design · 2026",
  status: "active",
  notes: "Funcionário · resultado consolidado do processo de avaliação.",
  evaluation: {
    evaluatedBy: "Victor Lima",
    evaluatedAt: "2026-08-24T12:00:00.000Z",
    technicalScore: 4.2,
    behavioralScore: 3.7,
    previous: {
      tecnologia: 4,
      dominio: 3,
      pessoas: 4,
      processos: 4,
      influencia: 3,
      estudo: 3,
    },
    rationale: {
      tecnologia:
        "É uma referência e está bem envolvido — do Figma Make ao uso de IA hoje. Tem contribuído bastante, com entregas diretas e indiretas com IA, de forma mais pontual com o pessoal de Vitória; promove fluxos, avalia e sugere melhorias (ex.: DS do Pro, handoffs pontuais, documentações). Precisa, porém, planejar e agir de forma mais estratégica e equilibrada com a parte operacional de mão na massa: muitas vezes, um olhar mais atento ao planejamento e ao repertório ajuda a garantir o domínio dessas tecnologias. Esteja atento ao cenário global de tecnologia no design, expandindo repertório e conhecimento sempre que possível e trazendo padrões de mercado.",
      dominio:
        "Tem feito muitas entregas relacionadas a POCs e interfaces de IA e se relaciona muito bem com os produtos, em profundidade. Tem experiência e maturidade, envolvendo-se nas definições e etapas dos produtos. Precisa, porém, de atenção com os momentos de engenharia infinita, produzir e trazer mais métricas e documentações que impactem os produtos, e evitar o isolamento — estar mais presente e mais envolvido.",
      pessoas:
        "Precisa de mais continuidade na participação com o time de design. Conduziu conversas com pessoas, acelerando e ensinando — algo pontual, mas bem aceito pelo time, em papos sobre uso de IA. O relacionamento com o time, porém, ainda é muito pontual: precisa ser mais ágil e prático nesse contato e torná-lo mais frequente, criando um ambiente de feedback, incentivo e crescimento. Conforme melhorar essa presença, com certeza vai evoluir ainda mais.",
      processos:
        "Está trazendo melhorias, tem questionado e somado nos processos e está envolvido de forma pontual com IA, caminhando de forma gradual e sólida. Precisa, porém, se organizar melhor: ajustar repasses e tamanhos, não cair em engenharia infinita e ter atenção na hora de planejar e executar — precisamos de escala, padrões e estudo. Também tem sido absorvido pelas muitas demandas e entregas. Acredito que está bem próximo do nível 5.",
      influencia:
        "Tem impactado de forma bem visível, ainda que pontual, principalmente em Vitória. Tem entregado bastante e é uma referência consultada sempre que preciso; maturidade e execução são seus pontos fortes, além da proximidade com as lideranças. Precisa melhorar a influência com o time de design, participando mais para decidir junto com o time.",
      estudo:
        "Mostrou evolução estudando IA e design nesse período — do Figma Make aos dias de hoje; vale lembrar que, quando começamos, estava um pouco fora das atualidades. Ainda precisa de ajustes em alguns pontos: tem se perdido em meio a tantas coisas (por exemplo, fluxos de IA gigantes e ineficazes, engenharia infinita). Com acompanhamento e direcionamento, pode fortalecer ainda mais seus conhecimentos. Acredito que faltou mostrar mais da experiência que tem para o time.",
    },
    // Ordem da tabela "Skills comportamentais (avaliação final)", preservada.
    behavioral: [
      {
        id: "design-system",
        label: "Design System — consistência de uso e contribuição (componentização, reuso).",
        score: 3.86,
      },
      {
        id: "pesquisa-discovery",
        label: "Pesquisa & discovery — embasa o design em research e dados do usuário.",
        score: 3.14,
      },
      { id: "postura", label: "Postura Profissional", score: 4 },
      { id: "responsabilidade-entrega", label: "Responsabilidade e Consciência de Entrega", score: 4 },
      { id: "comunicacao", label: "Comunicação e Alinhamento", score: 3.71 },
      { id: "colaboracao", label: "Colaboração e Trabalho em Equipe", score: 3 },
      { id: "proatividade", label: "Proatividade e Autonomia", score: 4.14 },
      { id: "adaptabilidade", label: "Adaptabilidade e Aprendizado", score: 3.86 },
      { id: "conflito", label: "Resolução de Conflito e Maturidade", score: 3.86 },
      { id: "impacto", label: "Senso de Responsabilidade e Impacto", score: 3.86 },
      { id: "etica", label: "Ética, Respeito e Cultura", score: 3.86 },
      { id: "energia", label: "Energia, Bem-estar e Sustentabilidade", score: 3.86 },
      { id: "feedback", label: "Recebe e aplica feedback", score: 3 },
      { id: "foco", label: "Foco e gestão de prioridades", score: 3.71 },
    ],
  },
  createdAt: "2026-01-15T12:00:00.000Z",
  updatedAt: "2026-08-24T12:00:00.000Z",
}

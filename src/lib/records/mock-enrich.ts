import type { EnrichedFields } from "@/lib/records/types"

export function deriveTitleFromRaw(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ")
  if (!cleaned) return "Registro profissional"

  // Quebra apenas em pontuação forte e conectivos que iniciam uma nova oração.
  // "com/para/que/como" foram deixados de fora de propósito: eles costumam
  // continuar a frase principal e cortá-los mutila o título no meio de um
  // substantivo (ex.: "...design system para tokens").
  const firstChunk =
    cleaned
      .split(/[,;.!?]|\s+(?:mas|porque|portanto|quando|onde|–|-)(?:\s+|$)/i)[0]
      ?.trim() ?? cleaned

  const words = firstChunk.split(/\s+/)
  let title = words.slice(0, 9).join(" ")
  // Remove artigos/preposições/conectivos soltos quando o corte cai num deles,
  // evitando títulos que terminam de forma dependente (ex.: "...design system para").
  title = title
    .replace(/\s+(?:de|da|do|dos|das|um|uma|o|a|os|as|e|em|no|na|nos|nas|com|para|que|como)$/i, "")
    .trim()
  title = title.charAt(0).toUpperCase() + title.slice(1)

  return title || "Registro profissional"
}

function firstSentence(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ")
  if (!cleaned) return ""
  const sentence = cleaned.split(/[.!?]/)[0]?.trim() || cleaned
  const normalized = sentence.charAt(0).toUpperCase() + sentence.slice(1)
  return normalized.endsWith(".") ? normalized : `${normalized}.`
}

function deriveImpactFromRaw(raw: string, title: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ")
  const lower = cleaned.toLowerCase()

  if (!cleaned) {
    return `A entrega "${title}" contribuiu para a evolução do produto e do time.`
  }

  if (/template|report|relatório|relatorio|documentação|documentacao|padron/.test(lower)) {
    return `${firstSentence(cleaned)} Padronizou entregas recorrentes e reduziu retrabalho na comunicação do time.`
  }

  if (/versão|versao|update|web|site|app|mobile|frontend|interface|experiência|experiencia|ux|ui|melhoria/.test(lower)) {
    return `${firstSentence(cleaned)} Ampliou a qualidade da experiência digital e o valor percebido pelos usuários.`
  }

  if (/processo|fluxo|operacional|automação|automacao|rotina|workflow/.test(lower)) {
    return `${firstSentence(cleaned)} Ganho de eficiência operacional e clareza de execução para o time.`
  }

  if (/bug|correção|correcao|fix|incidente|estabilidade/.test(lower)) {
    return `${firstSentence(cleaned)} Restaurou confiabilidade e previsibilidade para quem depende desta entrega.`
  }

  return `${firstSentence(cleaned)} Essa contribuição gerou valor concreto para o time e para o produto, conforme registrado.`
}

function deriveContextFromRaw(raw: string, title: string): string {
  const sentence = firstSentence(raw)
  if (sentence) {
    return `Antes desta entrega, havia uma necessidade ligada a "${title.toLowerCase()}". ${sentence}`
  }
  return `Contexto que motivou "${title}": oportunidade ou necessidade de melhoria identificada no fluxo de trabalho ou no produto.`
}

function deriveObjectiveFromRaw(raw: string, title: string): string {
  return `Executar "${title}" com foco em resultado mensurável para usuários, time e produto.`
}

function deriveDecisionsFromRaw(raw: string): string {
  const cleaned = raw.trim()
  if (!cleaned) {
    return "Priorizou-se clareza de escopo, alinhamento com stakeholders e entrega incremental quando aplicável."
  }
  return `Com base no que foi registrado — "${cleaned.slice(0, 120)}${cleaned.length > 120 ? "…" : ""}" — priorizou-se qualidade, alinhamento e entrega dentro do prazo acordado.`
}

function deriveLearningsFromRaw(raw: string, title: string): string {
  const lower = raw.toLowerCase()
  if (/design|ux|ui|experiência|experiencia/.test(lower)) {
    return `Iterações em "${title}" reforçaram a importância de validar experiência com usuários antes de consolidar a solução.`
  }
  if (/template|report|relatório|relatorio/.test(lower)) {
    return `Padronizar "${title}" acelerou entregas futuras e reduziu dependência de conhecimento tácito.`
  }
  return `Aprendizados desta entrega fortalecem a atuação em iniciativas similares a "${title}".`
}

export function mockEnrich(raw: string): EnrichedFields {
  const lower = raw.toLowerCase()
  const title = deriveTitleFromRaw(raw)

  if (/design.?system|sistema de design|kaizen|token|component/.test(lower)) {
    return {
      title,
      context:
        "A equipe não possuía uma fonte centralizada de verdade para os padrões e componentes do Design System — o conhecimento estava fragmentado entre arquivos dispersos, dependendo de comunicação informal e do conhecimento tácito de poucos membros.",
      objective:
        "Criar ou aprimorar a documentação e estrutura do Design System, centralizando referências de componentes, tokens e guidelines para alinhar design e engenharia em torno de padrões consistentes.",
      contribution: raw,
      decisions:
        "Priorizou-se a arquitetura de informação e navegação antes da execução técnica, garantindo que os padrões fossem descobríveis e compreensíveis por novos membros. A estrutura foi validada com o time de engenharia antes da publicação.",
      impact:
        "Centralizou o conhecimento do Design System em uma referência única e navegável, reduziu inconsistências visuais entre produtos e acelerou o onboarding de novos membros de design e engenharia. Estabeleceu uma base sólida para escalar o sistema com menor custo de coordenação.",
      learnings:
        "Documentação de Design System é produto e processo: sua adoção depende tanto da qualidade do conteúdo quanto da facilidade de descoberta. A governança do sistema precisa ser acordada desde o início para evitar desatualização.",
    }
  }

  if (/arquitetura|microsservi|plataforma|backend|api|módulo/.test(lower)) {
    return {
      title,
      context:
        "O crescimento do produto criou dependências críticas na arquitetura existente, gerando gargalos de escalabilidade e dificultando entregas independentes entre os times.",
      objective:
        "Definir uma arquitetura técnica que viabilizasse escala independente dos módulos, reduzisse acoplamento e permitisse que os times entregassem com mais autonomia e velocidade.",
      contribution: raw,
      decisions:
        "Analisamos trade-offs entre migração incremental e big-bang, optando por uma abordagem de strangler fig para minimizar risco. Priorizamos as fronteiras de domínio com maior volume de mudança como ponto de partida.",
      impact:
        "Reduziu dependências críticas entre equipes, viabilizou deploys independentes por domínio e estabeleceu um padrão replicável para evolução da plataforma. O time ganhou autonomia para entregar sem coordenação excessiva.",
      learnings:
        "Decisões arquiteturais são decisões organizacionais: o sucesso da migração dependeu tanto do alinhamento entre times quanto da qualidade técnica da solução.",
    }
  }

  if (/lider|conduzi|alinhei|stakeholder|apresent/.test(lower)) {
    return {
      title,
      context:
        "A iniciativa envolvia múltiplos stakeholders com perspectivas divergentes, sem um processo claro de tomada de decisão que permitisse avançar com velocidade e confiança.",
      objective:
        "Facilitar o alinhamento entre as partes interessadas, criar clareza sobre prioridades e garantir que a iniciativa avançasse com o suporte necessário para execução bem-sucedida.",
      contribution: raw,
      decisions:
        "Adotou-se uma abordagem estruturada de facilitação — definindo critérios de decisão antes das reuniões, documentando trade-offs explicitamente e garantindo que todos os envolvidos compreendessem as implicações das opções.",
      impact:
        "Desbloqueou a iniciativa que estava parada por falta de alinhamento, criou precedente de processo de decisão replicável e aumentou a confiança das partes envolvidas na execução.",
      learnings:
        "Liderança em contextos de alta ambiguidade requer tanto habilidade de facilitação quanto capacidade de síntese — transformar diversidade de perspectivas em decisão clara é uma competência crítica.",
    }
  }

  return {
    title,
    context: deriveContextFromRaw(raw, title),
    objective: deriveObjectiveFromRaw(raw, title),
    contribution: raw,
    decisions: deriveDecisionsFromRaw(raw),
    impact: deriveImpactFromRaw(raw, title),
    learnings: deriveLearningsFromRaw(raw, title),
  }
}

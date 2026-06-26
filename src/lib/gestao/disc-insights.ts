import { DISC_PROFILES, type DiscProfileId } from "@/lib/gestao/types"

export interface DiscSuggestions {
  strengths: string
  attentionPoints: string
  howToLead: string
  howNotToLead: string
}

const PROFILE_HINTS: Record<
  DiscProfileId,
  {
    strengths: string
    attention: string
    lead: string
    avoid: string
  }
> = {
  executor: {
    strengths: "Orientação a resultados, senso de urgência e capacidade de destravar entregas.",
    attention: "Pode priorizar velocidade em detrimento de alinhamento ou detalhes técnicos.",
    lead: "Metas claras, autonomia com checkpoints curtos e feedback direto sobre impacto.",
    avoid: "Reuniões longas sem decisão, burocracia excessiva ou falta de clareza de prioridade.",
  },
  comunicador: {
    strengths: "Boa comunicação, energia positiva e facilidade para engajar pessoas e stakeholders.",
    attention: "Pode dispersar foco ou subestimar follow-up e documentação.",
    lead: "Reconhecimento público, espaço para ideias e conexão com o propósito do time.",
    avoid: "Isolamento, tom excessivamente crítico sem calor humano ou silêncio prolongado.",
  },
  planejador: {
    strengths: "Consistência, apoio ao time e estabilidade em contextos de mudança.",
    attention: "Pode resistir a mudanças bruscas ou demorar a tomar posição em conflitos.",
    lead: "Segurança psicológica, ritmo previsível e tempo para processar antes de decidir.",
    avoid: "Pressão abrupta, mudanças constantes de prioridade ou confronto público.",
  },
  analista: {
    strengths: "Rigor, qualidade e pensamento analítico aplicado a problemas complexos.",
    attention: "Pode analisar demais antes de agir ou ser percebido como distante emocionalmente.",
    lead: "Dados, critérios claros, profundidade técnica e tempo para preparar argumentos.",
    avoid: "Decisões impulsivas, falta de estrutura ou feedback vago sem exemplos concretos.",
  },
}

function joinUnique(parts: string[]): string {
  return parts.filter(Boolean).join(" ")
}

export function computeDiscSuggestions(discProfiles: DiscProfileId[]): DiscSuggestions {
  if (!discProfiles.length) {
    return {
      strengths: "",
      attentionPoints: "",
      howToLead: "",
      howNotToLead: "",
    }
  }

  const dominant = discProfiles[0]
  const secondary = discProfiles.slice(1)
  const dominantHints = PROFILE_HINTS[dominant]
  const secondaryHints = secondary.map((id) => PROFILE_HINTS[id])

  const dominantLabel = DISC_PROFILES.find((p) => p.id === dominant)?.label ?? dominant
  const mixLabel = secondary
    .map((id) => DISC_PROFILES.find((p) => p.id === id)?.label)
    .filter(Boolean)
    .join(" + ")

  const prefix = mixLabel
    ? `Perfil dominante ${dominantLabel}, com traços de ${mixLabel}. `
    : `Perfil ${dominantLabel}. `

  return {
    strengths: prefix + joinUnique([dominantHints.strengths, ...secondaryHints.map((h) => h.strengths)]),
    attentionPoints:
      prefix +
      joinUnique([dominantHints.attention, ...secondaryHints.map((h) => h.attention)]),
    howToLead: prefix + joinUnique([dominantHints.lead, ...secondaryHints.map((h) => h.lead)]),
    howNotToLead: prefix + joinUnique([dominantHints.avoid, ...secondaryHints.map((h) => h.avoid)]),
  }
}

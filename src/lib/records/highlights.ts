export type HighlightTone = "violet" | "sky" | "emerald" | "amber"

export interface HighlightDef {
  label: string
  tone: HighlightTone
  regex: RegExp
}

// Rótulos derivados automaticamente do texto do registro quando não há destaque manual.
// A ordem define a prioridade (o primeiro match vira o destaque principal do card).
export const HIGHLIGHT_DEFS: HighlightDef[] = [
  { label: "Redução de retrabalho", tone: "emerald", regex: /(retrabalho|rework)/ },
  { label: "Ganho operacional", tone: "sky", regex: /(eficien|produtiv|tempo|operacional|agilidad)/ },
  { label: "Padronização", tone: "violet", regex: /(padron|consisten|governan|design system)/ },
  { label: "Melhoria de comunicação", tone: "amber", regex: /(comunic|alinh|clareza|stakeholder)/ },
  { label: "Aceleração de desenvolvimento", tone: "sky", regex: /(aceler|velocity|desenvolvimento)/ },
  { label: "Automação", tone: "violet", regex: /(automat|automa|workflow|pipeline)/ },
  { label: "Clareza estratégica", tone: "amber", regex: /(estrateg|prioriz|direcionamento)/ },
  { label: "Escalabilidade", tone: "violet", regex: /(escala|escalabil|reuso|foundation)/ },
]

// Sugestões oferecidas no formulário de edição (datalist).
export const HIGHLIGHT_SUGGESTIONS: string[] = HIGHLIGHT_DEFS.map((def) => def.label)

// Resolve a cor de um rótulo de destaque. Rótulos conhecidos mantêm sua cor;
// destaques personalizados caem no tom âmbar por padrão.
export function resolveHighlightTone(label: string): HighlightTone {
  const normalized = label.trim().toLowerCase()
  const found = HIGHLIGHT_DEFS.find((def) => def.label.toLowerCase() === normalized)
  return found?.tone ?? "amber"
}

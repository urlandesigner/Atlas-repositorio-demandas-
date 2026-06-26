import { getOpenAIClient } from "@/lib/openai/client"
import type { ReportSection } from "@/lib/evolution/types"

function mergeSections(incoming: unknown, fallback: ReportSection[]): ReportSection[] {
  if (!Array.isArray(incoming)) return fallback
  return fallback.map((section) => {
    const match = incoming.find(
      (item) => (item as Partial<ReportSection>)?.id === section.id
    ) as Partial<ReportSection> | undefined
    const content =
      typeof match?.content === "string" && match.content.trim() ? match.content.trim() : section.content
    return { ...section, content, source: "ai" as const }
  })
}

export async function POST(request: Request) {
  let body: { baseline?: { sections?: ReportSection[] } }
  try {
    body = (await request.json()) as { baseline?: { sections?: ReportSection[] } }
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }
  const { baseline } = body
  const fallback = baseline?.sections ?? []

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !apiKey.startsWith("sk-") || !fallback.length) {
    return Response.json({ sections: fallback })
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você ajuda a redigir um dossiê profissional de evolução de carreira (promoção/progressão).

REGRAS:
• Recebe seções pré-preenchidas em JSON com evidências reais.
• Reescreva APENAS "content" de cada seção — tom executivo, narrativo, confiante sem hipérboles.
• Mantenha os mesmos "id". Não invente projetos, métricas ou reconhecimentos.
• O resumo executivo deve ser 2–3 frases. Contribuições podem usar **negrito** em títulos.
• Linguagem: evidências identificadas, não avaliação definitiva.
• Responda APENAS: { "sections": [{ "id", "content" }] }`,
        },
        { role: "user", content: JSON.stringify({ sections: fallback }) },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(text) as { sections?: unknown }
    return Response.json({ sections: mergeSections(parsed.sections, fallback) })
  } catch {
    return Response.json({ sections: fallback })
  }
}

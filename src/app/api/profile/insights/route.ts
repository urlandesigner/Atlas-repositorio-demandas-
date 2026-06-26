import { getOpenAIClient } from "@/lib/openai/client"
import type { Insight, ProfileInsights } from "@/lib/profile/derive"

// Recebe os insights determinísticos (baseline) calculados no cliente e, quando
// há OPENAI_API_KEY, reescreve o texto de forma mais natural e específica —
// mantendo a MESMA estrutura (ids, chaves, sugestões). Sem chave, ecoa o baseline.
// Espelha o padrão de app/api/records/enrich/route.ts (mock-first).

function sanitizeInsights(value: unknown, fallback: ProfileInsights): ProfileInsights {
  if (!value || typeof value !== "object") return fallback
  const data = value as Partial<ProfileInsights>

  const mergeGroup = (incoming: unknown, base: Insight[]): Insight[] => {
    if (!Array.isArray(incoming)) return base
    return base.map((item) => {
      const match = incoming.find(
        (i) => (i as Partial<Insight>)?.id === item.id
      ) as Partial<Insight> | undefined
      const text = typeof match?.text === "string" && match.text.trim() ? match.text.trim() : item.text
      return { ...item, text }
    })
  }

  return {
    highlights: mergeGroup(data.highlights, fallback.highlights),
    opportunities: mergeGroup(data.opportunities, fallback.opportunities),
  }
}

export async function POST(request: Request) {
  let body: { baseline?: ProfileInsights }
  try {
    body = (await request.json()) as { baseline?: ProfileInsights }
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }
  const { baseline } = body

  const fallback: ProfileInsights = {
    highlights: baseline?.highlights ?? [],
    opportunities: baseline?.opportunities ?? [],
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !apiKey.startsWith("sk-")) {
    return Response.json({ insights: fallback })
  }

  if (!fallback.highlights.length && !fallback.opportunities.length) {
    return Response.json({ insights: fallback })
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um mentor de carreira. Recebe insights pré-calculados sobre a evolução de um profissional (em JSON) e deve reescrever APENAS o campo "text" de cada item para soar mais natural, específico e encorajador em português do Brasil.

REGRAS:
• Mantenha exatamente os mesmos "id" de cada item — não invente, não remova, não reordene.
• Não altere nenhum campo além de "text".
• Cada "text" deve ter no máximo 8 palavras, tom executivo, sem clichês vazios.
• Destaques celebram uma força real; oportunidades apontam um gap de forma construtiva.
• Responda APENAS com JSON no formato: { "highlights": [{ "id", "text" }], "opportunities": [{ "id", "text" }] }`,
        },
        {
          role: "user",
          content: JSON.stringify(fallback),
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(text)
    return Response.json({ insights: sanitizeInsights(parsed, fallback) })
  } catch {
    return Response.json({ insights: fallback })
  }
}

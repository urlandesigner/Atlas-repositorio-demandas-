import { getOpenAIClient } from "@/lib/openai/client"
import type { DiscSuggestions } from "@/lib/gestao/disc-insights"

function sanitize(value: unknown, fallback: DiscSuggestions): DiscSuggestions {
  if (!value || typeof value !== "object") return fallback
  const data = value as Partial<DiscSuggestions>
  return {
    strengths:
      typeof data.strengths === "string" && data.strengths.trim()
        ? data.strengths.trim()
        : fallback.strengths,
    attentionPoints:
      typeof data.attentionPoints === "string" && data.attentionPoints.trim()
        ? data.attentionPoints.trim()
        : fallback.attentionPoints,
    howToLead:
      typeof data.howToLead === "string" && data.howToLead.trim()
        ? data.howToLead.trim()
        : fallback.howToLead,
    howNotToLead:
      typeof data.howNotToLead === "string" && data.howNotToLead.trim()
        ? data.howNotToLead.trim()
        : fallback.howNotToLead,
  }
}

export async function POST(request: Request) {
  let body: { baseline?: DiscSuggestions; discLabels?: string[] }
  try {
    body = (await request.json()) as { baseline?: DiscSuggestions; discLabels?: string[] }
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }
  const { baseline, discLabels } = body

  const fallback: DiscSuggestions = {
    strengths: baseline?.strengths ?? "",
    attentionPoints: baseline?.attentionPoints ?? "",
    howToLead: baseline?.howToLead ?? "",
    howNotToLead: baseline?.howNotToLead ?? "",
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !apiKey.startsWith("sk-") || !fallback.strengths) {
    return Response.json({ suggestions: fallback })
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você ajuda gestores a interpretar perfis DISC de liderados.

REGRAS:
• Recebe sugestões baseline em JSON e rótulos dos perfis DISC selecionados.
• Reescreva cada campo para português do Brasil, tom consultivo (sugestão, não diagnóstico).
• Mantenha os mesmos campos: strengths, attentionPoints, howToLead, howNotToLead.
• Cada campo: 1–2 frases objetivas, específicas ao mix DISC informado.
• Nunca use linguagem de avaliação formal ("nota", "aprovado", "deficiência").
• Responda APENAS JSON com os 4 campos.`,
        },
        {
          role: "user",
          content: JSON.stringify({ discLabels: discLabels ?? [], baseline: fallback }),
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(text)
    return Response.json({ suggestions: sanitize(parsed, fallback) })
  } catch {
    return Response.json({ suggestions: fallback })
  }
}

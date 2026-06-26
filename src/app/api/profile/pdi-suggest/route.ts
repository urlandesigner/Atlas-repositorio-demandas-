import { getOpenAIClient } from "@/lib/openai/client"
import {
  PDI_MAX_LEVEL,
  PDI_RUBRIC,
  PDI_THEME_LABEL,
  PDI_THEMES,
  type PdiTheme,
} from "@/lib/profile/pdi"

// Refina a sugestão de nível 0–6 por tema da Matriz PDI. Recebe o baseline
// determinístico (já calculado no cliente) + os scores de evidência, e — quando
// há OPENAI_API_KEY — pede ao modelo para casar a evidência com a rubrica real
// de cada tema. Sem chave, ecoa o baseline. Espelha records/enrich/route.ts.

type LevelMap = Partial<Record<PdiTheme, number>>

function clampLevel(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? Math.round(value) : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(n, PDI_MAX_LEVEL))
}

function sanitize(value: unknown, baseline: LevelMap): Record<PdiTheme, number> {
  const incoming = (value && typeof value === "object" ? value : {}) as LevelMap
  const result = {} as Record<PdiTheme, number>
  for (const theme of PDI_THEMES) {
    const fallback = clampLevel(baseline[theme], 0)
    result[theme] = clampLevel(incoming[theme], fallback)
  }
  return result
}

export async function POST(request: Request) {
  let body: { baseline?: LevelMap; scores?: LevelMap }
  try {
    body = (await request.json()) as { baseline?: LevelMap; scores?: LevelMap }
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }
  const { baseline, scores } = body
  const safeBaseline = baseline ?? {}

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !apiKey.startsWith("sk-")) {
    return Response.json({ suggestions: sanitize(safeBaseline, safeBaseline) })
  }

  // Monta a rubrica + evidência por tema para o modelo decidir.
  const themesContext = PDI_THEMES.map((theme) => ({
    theme,
    label: PDI_THEME_LABEL[theme],
    rubric: PDI_RUBRIC[theme].map((descricao, nivel) => ({ nivel, descricao })),
    evidenceScore: Math.round((scores?.[theme] ?? 0) * 10) / 10,
    baseline: safeBaseline[theme] ?? 0,
  }))

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você avalia o nível de competência (0 a 6) de um profissional em 6 temas, comparando a EVIDÊNCIA acumulada com a RUBRICA de cada tema.

REGRAS:
• Para cada tema, escolha o nível (0–6) cujo descritor melhor representa a evidência disponível.
• Use o "evidenceScore" (maior = mais evidência) e o "baseline" como âncora; ajuste no máximo ±1 em relação ao baseline, salvo descompasso claro.
• Seja conservador: não infle níveis sem evidência.
• Responda APENAS com JSON no formato { "tecnologia": n, "dominio": n, "pessoas": n, "processos": n, "influencia": n, "estudo": n }.`,
        },
        {
          role: "user",
          content: JSON.stringify(themesContext),
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(text)
    return Response.json({ suggestions: sanitize(parsed, safeBaseline) })
  } catch {
    return Response.json({ suggestions: sanitize(safeBaseline, safeBaseline) })
  }
}

import type { EnrichedFields } from "@/lib/records/types"
import { getOpenAIClient } from "@/lib/openai/client"
import { mockEnrich } from "@/lib/records/mock-enrich"

function sanitizeEnriched(value: unknown, fallback: EnrichedFields): EnrichedFields {
  const data = (value && typeof value === "object" ? value : {}) as Partial<EnrichedFields>
  const pick = (incoming: unknown, base: string) =>
    typeof incoming === "string" && incoming.trim() ? incoming.trim() : base
  return {
    title: pick(data.title, fallback.title),
    context: pick(data.context, fallback.context),
    objective: pick(data.objective, fallback.objective),
    contribution: pick(data.contribution, fallback.contribution),
    decisions: pick(data.decisions, fallback.decisions),
    impact: pick(data.impact, fallback.impact),
    learnings: pick(data.learnings, fallback.learnings),
  }
}

export async function POST(request: Request) {
  let raw: string
  try {
    const body = (await request.json()) as { raw?: unknown }
    if (typeof body.raw !== "string" || !body.raw.trim()) {
      return Response.json({ error: "Campo 'raw' é obrigatório." }, { status: 400 })
    }
    raw = body.raw
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !apiKey.startsWith("sk-")) {
    await new Promise((r) => setTimeout(r, 3200))
    return Response.json({ enriched: mockEnrich(raw) })
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um consultor sênior de desenvolvimento de carreira especializado em documentar contribuições de profissionais de tecnologia, produto e design com linguagem executiva e estratégica.

Seu papel: transformar uma descrição casual em registro profissional de alto nível — o tipo de documentação que aparece em performance reviews, casos de promoção e apresentações de carreira.

━━━ REGRAS OBRIGATÓRIAS ━━━

TÍTULO (campo "title"):
• Deve referenciar o projeto ou contexto real mencionado — nunca gere "Registro de impacto profissional" ou similar
• Formato: [Verbo substantivado ou de ação] + [do/da/de] + [Projeto/Área] + [contexto se necessário]
• Máximo 80 caracteres
• Exemplos corretos:
  ✅ "Estruturação do site de documentação do Design System Kaizen"
  ✅ "Definição da arquitetura de microsserviços do módulo financeiro"
  ✅ "Reestruturação do fluxo de onboarding do app mobile"
  ❌ "Registro de impacto profissional"
  ❌ "Contribuição relevante para o time"

CONTEXTO (campo "context"):
• Descreva o cenário organizacional antes da sua ação — qual era o problema, gap ou oportunidade
• Use vocabulário de negócio: "fragmentação", "dependência crítica", "gargalo de escalabilidade", "falta de visibilidade"
• 2-3 frases

OBJETIVO (campo "objective"):
• Descreva o que você quis alcançar — resultado esperado, não a atividade
• Seja específico: mencione o que mudaria após a iniciativa
• 1-2 frases

CONTRIBUIÇÃO (campo "contribution"):
• Descreva O QUE VOCÊ FEZ especificamente — não o que "o time" fez em geral
• Mencione decisões tomadas, abordagens escolhidas, trade-offs enfrentados
• 2-4 frases

DECISÕES (campo "decisions"):
• Liste 2-3 decisões concretas e o raciocínio por trás delas
• Mostre o pensamento estratégico por trás das escolhas

IMPACTO (campo "impact"):
• NUNCA escreva frases genéricas como "resultado positivo para o time" ou "contribuição relevante"
• Estrutura: QUEM foi afetado + O QUÊ mudou concretamente + COMO se manifestou
• Se houver números ou percentuais no input, use-os
• Se não houver, descreva o impacto qualitativo com precisão executiva
• Palavras que funcionam: "centralizou", "reduziu fricção", "viabilizou escala", "estabeleceu precedente", "acelerou", "eliminou dependência"

APRENDIZADOS (campo "learnings"):
• Insights estratégicos ou técnicos relevantes para a carreira
• Conecte com o domínio profissional — não sejam genéricos
• 1-2 frases densas e específicas

INFERÊNCIA DE DOMÍNIO — aplique automaticamente:
• Design System → centralizaçâo, tokens, alinhamento design/dev, adoção, documentação, consistência
• Produto/Feature → discovery, métricas, ciclo de entrega, experiência do usuário
• Arquitetura → escalabilidade, acoplamento, autonomia de times, trade-offs técnicos
• Processo → eficiência operacional, redução de retrabalho, clareza de responsabilidades
• Liderança/Alinhamento → facilitação, influência sem autoridade, decisão em ambiguidade

Responda APENAS com JSON válido contendo os campos: title, context, objective, contribution, decisions, impact, learnings`,
        },
        {
          role: "user",
          content: raw,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? "{}"
    const enriched = sanitizeEnriched(JSON.parse(text), mockEnrich(raw))
    return Response.json({ enriched })
  } catch {
    await new Promise((r) => setTimeout(r, 1000))
    return Response.json({ enriched: mockEnrich(raw) })
  }
}

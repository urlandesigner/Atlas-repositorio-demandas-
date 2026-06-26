import type { RecordEntry } from "@/lib/records/types"
import { HIGHLIGHT_DEFS, resolveHighlightTone } from "@/lib/records/highlights"
import type { HighlightFeedItem, HighlightPeriod } from "./types"
import { isInPeriod } from "./periods"

function deriveHighlights(record: RecordEntry): string[] {
  const manual = record.highlight?.trim()
  if (manual) return [manual]

  const text = [record.enriched.impact, record.enriched.contribution, record.enriched.decisions]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

  const labels: string[] = []
  for (const def of HIGHLIGHT_DEFS) {
    if (def.regex.test(text)) labels.push(def.label)
  }

  if (!labels.length) {
    if (record.impactLevel >= 4) labels.push("Resultado estratégico")
    else if (record.atuacao === "liderança") labels.push("Ação de liderança")
    else labels.push("Impacto identificado")
  }

  return labels.slice(0, 3)
}

function buildFeaturedScore(record: RecordEntry, highlights: string[], pinnedIds: string[]): number {
  let score = record.impactLevel * 10 + highlights.length * 3
  if (record.impactScope === "company") score += 8
  if (record.impactScope === "area") score += 4
  if (["estratégia", "liderança", "arquitetura"].includes(record.atuacao)) score += 6
  if (pinnedIds.includes(record.id)) score += 100
  return score
}

function executiveSummary(record: RecordEntry): string {
  return (
    record.enriched.impact?.trim() ||
    record.enriched.contribution?.trim() ||
    record.enriched.objective?.trim() ||
    "Registro sem resumo executivo — abra para completar."
  )
}

export function computeHighlightFeed(
  records: RecordEntry[],
  period: HighlightPeriod,
  pinnedIds: string[] = [],
  now: Date = new Date()
): HighlightFeedItem[] {
  const filtered = records.filter((r) => isInPeriod(r.createdAt, period, now))

  return filtered
    .map((record) => {
      const highlights = deriveHighlights(record)
      return {
        recordId: record.id,
        title: record.enriched.title || "Entrega registrada",
        executiveSummary: executiveSummary(record),
        atuacao: record.atuacao,
        impactLevel: record.impactLevel,
        impactScope: record.impactScope,
        tags: record.tags,
        highlights,
        featuredScore: buildFeaturedScore(record, highlights, pinnedIds),
        createdAt: record.createdAt,
        projectName: record.projectName,
        record,
      }
    })
    .sort((a, b) => b.featuredScore - a.featuredScore || b.createdAt.localeCompare(a.createdAt))
}

// Re-export for tone styling in UI
export { resolveHighlightTone }

import type { EnrichedFields } from "@/lib/records/types"

export const GENERIC_MOCK_IMPACT =
  "Contribuição que gerou valor claro para o time e para o produto, com resultado reconhecido pelos envolvidos e base para iniciativas futuras no mesmo domínio."

export function isGenericMockEnrichImpact(impact: string | undefined | null): boolean {
  if (!impact?.trim()) return false
  return impact.trim() === GENERIC_MOCK_IMPACT
}

export function getRecordImpactText(record: {
  raw: string
  enriched: Pick<EnrichedFields, "impact" | "contribution">
}): string {
  const impact = record.enriched.impact?.trim()
  const contribution = record.enriched.contribution?.trim()
  const raw = record.raw?.trim()

  if (impact && !isGenericMockEnrichImpact(impact)) return impact
  if (contribution && contribution !== impact) return contribution
  return raw || impact || ""
}

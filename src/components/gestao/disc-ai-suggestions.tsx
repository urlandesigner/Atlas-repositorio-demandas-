"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { computeDiscSuggestions, type DiscSuggestions } from "@/lib/gestao/disc-insights"
import { DISC_PROFILES, type DiscProfileId } from "@/lib/gestao/types"

export function DiscAiSuggestions({
  discProfiles,
  onApply,
}: {
  discProfiles: DiscProfileId[]
  onApply: (suggestions: DiscSuggestions) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSuggest() {
    if (!discProfiles.length) {
      setError("Selecione ao menos um perfil comportamental.")
      return
    }

    setLoading(true)
    setError(null)

    const baseline = computeDiscSuggestions(discProfiles)
    const discLabels = discProfiles
      .map((id) => DISC_PROFILES.find((profile) => profile.id === id)?.label)
      .filter(Boolean)

    try {
      const res = await fetch("/api/gestao/disc-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseline, discLabels }),
      })
      const data = (await res.json()) as { suggestions?: DiscSuggestions }
      onApply(data.suggestions ?? baseline)
    } catch {
      onApply(baseline)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sugestões baseadas no perfil comportamental selecionado — revise antes de salvar.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSuggest}
          disabled={loading || !discProfiles.length}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          ) : (
            <Sparkles className="size-4" data-icon="inline-start" />
          )}
          Sugerir com IA
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

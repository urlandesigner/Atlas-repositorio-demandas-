"use client"

import { ChevronRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PdiLevelTrack } from "@/components/profile/pdi-level-track"
import {
  computePdiReadiness,
  formatPdiLevel,
  PDI_RUBRIC,
  PDI_THEMES,
  PDI_THEME_LABEL,
  type PdiTheme,
} from "@/lib/profile/pdi"
import type { PdiAssessment } from "@/lib/profile/pdi-store"
import { getBaselineLevels } from "@/lib/profile/pdi-store"
import { cn } from "@/lib/utils"

function formatBaselineDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  })
}

export function PdiBaselineMatrix({
  assessment,
  onOpenRubric,
}: {
  assessment: PdiAssessment
  onOpenRubric: (theme: PdiTheme) => void
}) {
  const baseline = getBaselineLevels(assessment)
  const readiness = computePdiReadiness(baseline, assessment.expected)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Último PDI</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Referência formal · {formatBaselineDate(assessment.baselineAt)} · {readiness}% no nível
          esperado
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {PDI_THEMES.map((theme) => {
          const level = baseline[theme]
          const expected = assessment.expected[theme]
          const met = level >= expected
          return (
            <div key={theme} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onOpenRubric(theme)}
                  className="group flex min-w-0 items-center gap-1 text-sm font-medium"
                >
                  {PDI_THEME_LABEL[theme]}
                  <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    met ? "text-brand-muted-foreground" : "text-muted-foreground"
                  )}
                >
                  {formatPdiLevel(level)} / {formatPdiLevel(expected)}
                </span>
              </div>
              <PdiLevelTrack current={level} expected={expected} size="md" />
              <span className="truncate text-xs text-muted-foreground">
                {PDI_RUBRIC[theme][level]}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

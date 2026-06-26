"use client"

import Link from "next/link"
import { ArrowUpRight, Plus, Target } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PdiLevelTrack } from "@/components/profile/pdi-level-track"
import {
  computeAllThemeObjectiveProgress,
  computePdiReadiness,
  computeProjectedPdiLevels,
  formatPdiLevel,
  PDI_THEMES,
  PDI_THEME_LABEL,
  type PdiTheme,
} from "@/lib/profile/pdi"
import type { PdiAssessment } from "@/lib/profile/pdi-store"
import { getBaselineLevels } from "@/lib/profile/pdi-store"
import type { ObjectiveEntry } from "@/lib/objectives/store"
import { cn } from "@/lib/utils"

export function PdiObjectiveProgressMatrix({
  assessment,
  objectives,
  onCreateObjective,
}: {
  assessment: PdiAssessment
  objectives: ObjectiveEntry[]
  onCreateObjective: (theme: PdiTheme) => void
}) {
  const baseline = getBaselineLevels(assessment)
  const progressByTheme = computeAllThemeObjectiveProgress(
    baseline,
    objectives,
    assessment.expected
  )
  const projected = computeProjectedPdiLevels(baseline, objectives, assessment.expected)
  const baselineReadiness = computePdiReadiness(baseline, assessment.expected)
  const projectedReadiness = computePdiReadiness(projected, assessment.expected)
  const readinessGain = projectedReadiness - baselineReadiness
  const advancingThemes = PDI_THEMES.filter((theme) => progressByTheme[theme].delta >= 0.15).length

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
            <Target className="size-4 text-brand" />
            Avanço via objetivos
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimativa dinâmica sobre o último PDI
            {readinessGain > 0
              ? ` · +${readinessGain} pp de prontidão`
              : advancingThemes
                ? ` · ${advancingThemes} tema(s) em movimento`
                : " · conecte objetivos aos temas"}
          </p>
        </div>
        <Link
          href="/professional/objectives"
          className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand-muted-foreground underline-offset-2 hover:underline"
        >
          Objetivos
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {PDI_THEMES.map((theme) => {
          const progress = progressByTheme[theme]
          const expected = assessment.expected[theme]
          const hasAdvance = progress.delta >= 0.15
          const met = progress.projectedLevel >= expected

          return (
            <div key={theme} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{PDI_THEME_LABEL[theme]}</span>
                <div className="flex shrink-0 items-center gap-2">
                  {hasAdvance ? (
                    <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[11px] font-medium text-brand-muted-foreground">
                      +{progress.delta.toFixed(1)}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      met ? "text-brand-muted-foreground" : "text-muted-foreground"
                    )}
                  >
                    {formatPdiLevel(progress.baselineLevel)}
                    {hasAdvance ? (
                      <span className="text-brand-muted-foreground">
                        {" "}
                        → {formatPdiLevel(Math.round(progress.projectedLevel))}
                      </span>
                    ) : null}{" "}
                    / {formatPdiLevel(expected)}
                  </span>
                </div>
              </div>

              <PdiLevelTrack
                current={progress.baselineLevel}
                expected={expected}
                projected={progress.projectedLevel}
                size="md"
              />

              <div className="flex min-h-5 items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {progress.linkedObjectives
                    ? `${progress.doneObjectives}/${progress.linkedObjectives} concluído(s) · ${progress.momentumPercent}% de momentum`
                    : "Nenhum objetivo vinculado a este tema"}
                </span>
                {!progress.linkedObjectives ? (
                  <button
                    type="button"
                    onClick={() => onCreateObjective(theme)}
                    className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-brand-muted-foreground underline-offset-2 hover:underline"
                  >
                    <Plus className="size-3" />
                    criar objetivo
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

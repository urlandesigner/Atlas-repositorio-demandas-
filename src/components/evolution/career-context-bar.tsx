"use client"

import { Trilha } from "@/components/career/trilha"
import { MetricCard } from "@/components/ui/metric-card"
import { Overline } from "@/components/ui/overline"
import type { CareerGoal, LevelDef } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

export function CareerContextBar({
  goal,
  ladder,
  currentLevelId,
  currentLevelName,
  readiness,
  strongCompetencies,
  totalCompetencies,
  className,
}: {
  goal: CareerGoal
  ladder: LevelDef[]
  currentLevelId: string
  currentLevelName: string
  readiness: number
  strongCompetencies?: number
  totalCompetencies?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-border/60 bg-card/[0.98] p-4 shadow-card",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Overline className="text-muted-foreground/70">
            Objetivo de carreira
          </Overline>
          <p className="mt-1 text-lg font-semibold tracking-tight">{goal.targetRole}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hoje em {currentLevelName}
            {goal.targetYear ? ` · meta ${goal.targetYear}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <MetricCard variant="tile" label="Prontidão no PDI" value={readiness} suffix="%" />
          {strongCompetencies !== undefined && totalCompetencies !== undefined ? (
            <MetricCard
              variant="tile"
              label="Competências evidenciadas"
              value={`${strongCompetencies}/${totalCompetencies}`}
            />
          ) : null}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <Trilha ladder={ladder} currentLevelId={currentLevelId} size="sm" />
      </div>
    </div>
  )
}

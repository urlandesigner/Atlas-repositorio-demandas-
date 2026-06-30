"use client"

import { LadderStepper } from "@/components/profile/ladder-stepper"
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
        "rounded-[12px] border border-border/60 bg-card/[0.98] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Objetivo de evolução
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{goal.targetRole}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Hoje em {currentLevelName}
            {goal.targetYear ? ` · meta ${goal.targetYear}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-6">
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums text-brand-muted-foreground">{readiness}%</p>
            <p className="text-[11px] text-muted-foreground">temas PDI no nível</p>
          </div>
          {strongCompetencies !== undefined && totalCompetencies !== undefined ? (
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums">
                {strongCompetencies}/{totalCompetencies}
              </p>
              <p className="text-[11px] text-muted-foreground">competências evidenciadas</p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <LadderStepper ladder={ladder} currentLevelId={currentLevelId} size="sm" />
      </div>
    </div>
  )
}

import { Card, CardContent } from "@/components/ui/card"
import { LadderStepper } from "@/components/profile/ladder-stepper"
import type { CareerGoal, LevelDef } from "@/lib/profile/types"

export function CareerGoalCard({
  goal,
  ladder,
  currentLevelId,
  progress,
}: {
  goal: CareerGoal
  ladder: LevelDef[]
  currentLevelId: string
  progress: number
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground/70">Objetivo de carreira</p>
            <p className="mt-0.5 text-base font-medium">
              {goal.targetRole}
              {goal.targetYear ? (
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  · meta {goal.targetYear}
                </span>
              ) : null}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xl font-semibold text-brand-muted-foreground tabular-nums">
              {progress}%
            </div>
            <p className="text-[11px] text-muted-foreground/70">temas no nível</p>
          </div>
        </div>

        <LadderStepper ladder={ladder} currentLevelId={currentLevelId} />
      </CardContent>
    </Card>
  )
}

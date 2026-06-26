"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LadderStepper } from "@/components/profile/ladder-stepper"
import { PdiBaselineMatrix } from "@/components/profile/pdi-baseline-matrix"
import { PdiObjectiveProgressMatrix } from "@/components/profile/pdi-objective-progress-matrix"
import { PdiRubricSheet } from "@/components/profile/pdi-rubric-sheet"
import { type PdiTheme } from "@/lib/profile/pdi"
import { setExpectedLevel, type PdiAssessment } from "@/lib/profile/pdi-store"
import type { LevelDef } from "@/lib/profile/types"
import type { ObjectiveEntry } from "@/lib/objectives/store"
import { levelIndex } from "@/lib/profile/store"

export function EvolutionPanel({
  ladder,
  currentLevelId,
  currentLevelName,
  assessment,
  objectives,
}: {
  ladder: LevelDef[]
  currentLevelId: string
  currentLevelName: string
  assessment: PdiAssessment
  objectives: ObjectiveEntry[]
}) {
  const router = useRouter()
  const [rubricTheme, setRubricTheme] = useState<PdiTheme | null>(null)

  const currentIndex = levelIndex(ladder, currentLevelId)
  const nextLevel = currentIndex >= 0 ? ladder[currentIndex + 1] ?? null : null

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Trilha de evolução</CardTitle>
          <p className="text-xs text-muted-foreground">
            {currentLevelName ? `Hoje em ${currentLevelName}` : "Sua progressão de carreira"}
            {nextLevel ? ` · próximo passo: ${nextLevel.name}` : ""}
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <LadderStepper
            ladder={ladder}
            currentLevelId={currentLevelId}
            size="lg"
            showCurrentHint
          />
        </CardContent>
      </Card>

      <PdiBaselineMatrix assessment={assessment} onOpenRubric={setRubricTheme} />

      <PdiObjectiveProgressMatrix
        assessment={assessment}
        objectives={objectives}
        onCreateObjective={(theme) =>
          router.push(`/professional/objectives?theme=${theme}`)
        }
      />

      <PdiRubricSheet
        theme={rubricTheme}
        current={
          rubricTheme ? assessment.baseline[rubricTheme].level : 0
        }
        expected={rubricTheme ? assessment.expected[rubricTheme] : 0}
        onOpenChange={(open) => {
          if (!open) setRubricTheme(null)
        }}
        onSetExpected={(level) => {
          if (rubricTheme) setExpectedLevel(rubricTheme, level)
        }}
      />
    </div>
  )
}

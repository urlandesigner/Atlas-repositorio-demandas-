"use client"

import { SoftSkillsPillarsEditor } from "@/components/gestao/soft-skills-pillars-editor"
import { SoftSkillsRadarChart } from "@/components/gestao/soft-skills-radar-chart"
import { Button } from "@/components/ui/button"
import {
  defaultSoftSkillsScores,
  type SoftSkillsRadar,
} from "@/lib/gestao/types"

export function SoftSkillsEditor({
  value,
  onChange,
}: {
  value: SoftSkillsRadar
  onChange: (next: SoftSkillsRadar) => void
}) {
  function updateScore(id: string, score: number) {
    onChange({
      ...value,
      scores: { ...value.scores, [id]: score },
    })
  }

  function updatePillars(pillars: SoftSkillsRadar["pillars"]) {
    const nextScores = defaultSoftSkillsScores(pillars)
    for (const pillar of pillars) {
      if (value.scores[pillar.id] !== undefined) {
        nextScores[pillar.id] = value.scores[pillar.id]
      }
    }
    onChange({
      ...value,
      pillars,
      scores: nextScores,
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
      <SoftSkillsRadarChart pillars={value.pillars} scores={value.scores} />

      <div className="space-y-4">
        <SoftSkillsPillarsEditor pillars={value.pillars} onChange={updatePillars} />

        <div className="space-y-3">
          <span className="text-sm font-medium">Notas (1–5)</span>
          {value.pillars.map((pillar) => (
            <div key={pillar.id} className="rounded-lg border px-3 py-2">
              <div className="mb-2 text-sm font-medium">{pillar.label}</div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={value.scores[pillar.id] ?? 3}
                  onChange={(event) => updateScore(pillar.id, Number(event.target.value))}
                  className="w-full accent-brand"
                />
                <span className="w-6 text-right text-sm font-medium tabular-nums">
                  {value.scores[pillar.id] ?? 3}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              ...value,
              scores: defaultSoftSkillsScores(value.pillars),
            })
          }
        >
          Resetar notas para 3
        </Button>
      </div>
    </div>
  )
}

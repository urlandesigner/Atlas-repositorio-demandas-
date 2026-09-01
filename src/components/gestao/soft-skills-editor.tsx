"use client"

import { SoftSkillsPillarsEditor } from "@/components/gestao/soft-skills-pillars-editor"
import { SoftSkillsRadarChart } from "@/components/gestao/soft-skills-radar-chart"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
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
    /**
     * Pilares em cima, radar ao lado das notas.
     *
     * Antes o radar dividia a fileira com uma coluna que empilhava Pilares e
     * Notas: 280px de gráfico contra 1052px de conteúdo, ou seja ~770px de
     * coluna vazia. E o pareamento estava errado — Pilares é configuração dos
     * nomes, Notas é o que o radar desenha. Com as notas ao lado, arrastar um
     * slider e ver a forma mudar acontece no mesmo campo de visão; o `sticky`
     * mantém isso verdadeiro enquanto se percorre os seis pilares.
     */
    <div className="space-y-6">
      <SoftSkillsPillarsEditor pillars={value.pillars} onChange={updatePillars} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        <div className="self-start lg:sticky lg:top-4">
          <SoftSkillsRadarChart pillars={value.pillars} scores={value.scores} />
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <span className="text-sm font-medium">Notas (1–5)</span>
            {value.pillars.map((pillar) => (
              <div key={pillar.id} className="rounded-lg border px-3 py-2">
                <div className="mb-2 text-sm font-medium">{pillar.label}</div>
                <div className="flex items-center gap-3">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={value.scores[pillar.id] ?? 3}
                    onValueChange={(next) =>
                      updateScore(pillar.id, Array.isArray(next) ? next[0] : next)
                    }
                    aria-label={`Nota de ${pillar.label}`}
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
    </div>
  )
}

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
          {/* Mesmo desenho da lista de pilares logo acima: uma moldura só,
              linhas numeradas e divisórias. Antes cada nota era uma caixa com
              borda dentro do card, seis vezes. No computador cada nota cabe numa
              linha (número, nome, barra, valor); no celular a barra desce para
              uma segunda linha, abaixo do nome. */}
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">Notas</span>
              <span className="label-mono text-muted-foreground">de 1 a 5</span>
            </div>
            <ol className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
              {value.pillars.map((pillar, index) => {
                const score = value.scores[pillar.id] ?? 3
                return (
                  <li
                    key={pillar.id}
                    className="grid grid-cols-[1.5rem_minmax(0,1fr)_2rem] items-center gap-x-3 gap-y-3 px-4 py-3.5 sm:grid-cols-[1.5rem_minmax(0,10rem)_minmax(0,1fr)_2rem]"
                  >
                    <span
                      aria-hidden="true"
                      className="label-mono text-muted-foreground tabular-nums"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-sm font-medium" title={pillar.label}>
                      {pillar.label}
                    </span>
                    <div className="order-last col-span-2 col-start-2 sm:order-none sm:col-span-1 sm:col-start-auto">
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={score}
                        onValueChange={(next) =>
                          updateScore(pillar.id, Array.isArray(next) ? next[0] : next)
                        }
                        aria-label={`Nota de ${pillar.label}`}
                      />
                    </div>
                    <span className="text-right font-mono text-sm font-medium text-foreground tabular-nums">
                      {score}
                    </span>
                  </li>
                )
              })}
            </ol>
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

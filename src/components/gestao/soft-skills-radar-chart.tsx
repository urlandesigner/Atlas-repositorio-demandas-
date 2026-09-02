"use client"

import { useMemo } from "react"

import { cn } from "@/lib/utils"
import type { SoftSkillPillar } from "@/lib/gestao/types"

const SIZE = 240
const CENTER = SIZE / 2
const MAX_RADIUS = 88
const LEVELS = [1, 2, 3, 4, 5]

/**
 * Rótulo do eixo em até duas linhas, quebrando no espaço mais próximo do meio.
 *
 * Antes cortava em 12 caracteres, então "Inteligência emocional" virava
 * "Inteligência…" — perdia justamente a palavra que distingue o pilar. A razão
 * do corte era geométrica: com 6 pilares os rótulos laterais caem em x=28 e
 * x=212 num viewBox de 240, e uma linha de ~95px vaza pela esquerda. Em duas
 * linhas de ~11 caracteres cada, ~48px, cabe.
 *
 * Só corta o que não tem como quebrar: uma única palavra longa demais.
 */
function labelLines(label: string, max = 14): string[] {
  if (label.length <= max) return [label]
  const words = label.trim().split(/\s+/)
  if (words.length === 1) {
    return [label.length > 16 ? `${label.slice(0, 15)}…` : label]
  }
  let split = 1
  let smallestDiff = Infinity
  for (let i = 1; i < words.length; i += 1) {
    const diff = Math.abs(
      words.slice(0, i).join(" ").length - words.slice(i).join(" ").length
    )
    if (diff < smallestDiff) {
      smallestDiff = diff
      split = i
    }
  }
  return [words.slice(0, split).join(" "), words.slice(split).join(" ")]
}

function polarPoint(index: number, total: number, radius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  }
}

function polygonPoints(
  pillars: SoftSkillPillar[],
  scores: Record<string, number>
): string {
  return pillars
    .map((pillar, index) => {
      const score = scores[pillar.id] ?? 3
      const radius = (score / 5) * MAX_RADIUS
      const point = polarPoint(index, pillars.length, radius)
      return `${point.x},${point.y}`
    })
    .join(" ")
}

export function SoftSkillsRadarChart({
  pillars,
  scores,
  className,
}: {
  pillars: SoftSkillPillar[]
  scores: Record<string, number>
  className?: string
}) {
  const points = useMemo(() => polygonPoints(pillars, scores), [pillars, scores])

  if (pillars.length < 3) {
    return (
      <p className="text-sm text-muted-foreground">
        Adicione pelo menos 3 pilares para exibir o radar.
      </p>
    )
  }

  return (
    <div className={cn("flex justify-center", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[280px]"
        role="img"
        aria-label="Radar de competências"
      >
        {LEVELS.map((level) => {
          const radius = (level / 5) * MAX_RADIUS
          const ring = pillars
            .map((_, index) => {
              const point = polarPoint(index, pillars.length, radius)
              return `${point.x},${point.y}`
            })
            .join(" ")
          return (
            <polygon
              key={level}
              points={ring}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          )
        })}

        {pillars.map((pillar, index) => {
          const outer = polarPoint(index, pillars.length, MAX_RADIUS)
          return (
            <line
              key={pillar.id}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          )
        })}

        <polygon
          points={points}
          fill="color-mix(in srgb, var(--color-brand) 28%, transparent)"
          stroke="var(--color-brand)"
          strokeWidth={2}
        />

        {pillars.map((pillar, index) => {
          const labelPoint = polarPoint(index, pillars.length, MAX_RADIUS + 18)
          return (
            <text
              key={`${pillar.id}-label`}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              // 9px aqui é unidade de viewBox, não pixel de tela: o SVG é
              // 240x240 e escala junto com o container. Não pertence à escala
              // tipográfica da página.
              className="fill-muted-foreground text-[9px]"
            >
              {labelLines(pillar.label).map((line, lineIndex, lines) => (
                <tspan
                  key={line}
                  x={labelPoint.x}
                  dy={lineIndex === 0 ? (lines.length > 1 ? "-0.45em" : "0") : "1.05em"}
                >
                  {line}
                </tspan>
              ))}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

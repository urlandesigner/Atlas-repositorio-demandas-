"use client"

import { useMemo } from "react"

import { cn } from "@/lib/utils"
import type { SoftSkillPillar } from "@/lib/gestao/types"

const SIZE = 240
const CENTER = SIZE / 2
const MAX_RADIUS = 88
const LEVELS = [1, 2, 3, 4, 5]

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
              className="fill-muted-foreground text-[9px]"
            >
              {pillar.label.length > 14
                ? `${pillar.label.slice(0, 12)}…`
                : pillar.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

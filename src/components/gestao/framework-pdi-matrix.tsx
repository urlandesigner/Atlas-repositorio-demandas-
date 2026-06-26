"use client"

import { useState } from "react"

import { FrameworkRubricSheet } from "@/components/gestao/framework-rubric-sheet"
import { PdiLevelTrack } from "@/components/profile/pdi-level-track"
import { formatPdiLevel } from "@/lib/profile/pdi"
import type { FrameworkTheme, PdiFramework } from "@/lib/gestao/pdi/types"
import { cn } from "@/lib/utils"

export function FrameworkPdiMatrix({
  framework,
  current,
  expected,
  readOnly = false,
  onLevelChange,
}: {
  framework: PdiFramework
  current: Record<string, number>
  expected: Record<string, number>
  readOnly?: boolean
  onLevelChange?: (themeId: string, level: number) => void
}) {
  const [rubricTheme, setRubricTheme] = useState<FrameworkTheme | null>(null)

  return (
    <>
      <div className="flex flex-col gap-4">
        {framework.themes.map((theme) => {
          const level = current[theme.id] ?? 0
          const target = expected[theme.id] ?? 0
          const met = level >= target

          return (
            <div key={theme.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRubricTheme(theme)}
                  className="text-left text-sm font-medium hover:underline"
                >
                  {theme.label}
                </button>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    met ? "text-brand-muted-foreground" : "text-muted-foreground"
                  )}
                >
                  {formatPdiLevel(level)} / {formatPdiLevel(target)}
                </span>
              </div>
              <PdiLevelTrack
                current={level}
                expected={target}
                onSelect={
                  readOnly ? undefined : (value) => onLevelChange?.(theme.id, value)
                }
                size="sm"
              />
              <p className="text-xs text-muted-foreground">{theme.rubric[level] ?? "—"}</p>
            </div>
          )
        })}
      </div>

      <FrameworkRubricSheet
        theme={rubricTheme}
        current={rubricTheme ? current[rubricTheme.id] ?? 0 : 0}
        expected={rubricTheme ? expected[rubricTheme.id] ?? 0 : 0}
        onOpenChange={(open) => {
          if (!open) setRubricTheme(null)
        }}
      />
    </>
  )
}

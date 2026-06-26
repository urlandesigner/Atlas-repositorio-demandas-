import { ChevronRight, Plus } from "lucide-react"

import { PdiLevelTrack } from "@/components/profile/pdi-level-track"
import { formatPdiLevel, PDI_RUBRIC, PDI_THEME_LABEL, type PdiTheme } from "@/lib/profile/pdi"
import type { PdiThemeState } from "@/lib/profile/pdi-store"
import { cn } from "@/lib/utils"

export function PdiThemeRow({
  theme,
  state,
  expected,
  onSelectLevel,
  onOpenRubric,
  onCreateObjective,
}: {
  theme: PdiTheme
  state: PdiThemeState
  expected: number
  onSelectLevel: (level: number) => void
  onOpenRubric: () => void
  onCreateObjective: () => void
}) {
  const met = state.level >= expected
  const above = state.level > expected
  const suggested = state.source === "ai" && !state.confirmedAt
  const deficit = expected - state.level

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenRubric}
          className="group flex min-w-0 items-center gap-1 text-sm font-medium"
        >
          {PDI_THEME_LABEL[theme]}
          <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {suggested ? (
            <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[11px] font-medium text-brand-muted-foreground">
              sugerido
            </span>
          ) : null}
          <span
            className={cn(
              "text-xs tabular-nums",
              met ? "text-brand-muted-foreground" : "text-muted-foreground"
            )}
          >
            {formatPdiLevel(state.level)} / {formatPdiLevel(expected)}
          </span>
        </div>
      </div>

      <PdiLevelTrack current={state.level} expected={expected} onSelect={onSelectLevel} />

      <div className="flex min-h-5 items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">
          {PDI_RUBRIC[theme][state.level]}
        </span>
        {met ? (
          <span className="shrink-0 text-[11px] font-medium text-brand-muted-foreground">
            {above ? "acima do esperado" : "no nível esperado"}
          </span>
        ) : (
          <button
            type="button"
            onClick={onCreateObjective}
            className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-brand-muted-foreground underline-offset-2 hover:underline"
          >
            <Plus className="size-3" />
            objetivo · faltam {deficit}
          </button>
        )}
      </div>
    </div>
  )
}

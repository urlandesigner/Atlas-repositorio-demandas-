import { formatPdiLevel, PDI_MAX_LEVEL } from "@/lib/profile/pdi"
import { cn } from "@/lib/utils"

const LEVELS = Array.from({ length: PDI_MAX_LEVEL + 1 }, (_, i) => i)

const DOT_SIZE = {
  sm: "size-2.5",
  md: "size-3.5",
} as const

// Régua de níveis 0–6. Pontos preenchidos até o nível atual; o nível esperado
// ganha um anel. projected (opcional) marca o avanço estimado via objetivos.
export function PdiLevelTrack({
  current,
  expected,
  projected,
  onSelect,
  size = "md",
}: {
  current: number
  expected: number
  projected?: number
  onSelect?: (level: number) => void
  size?: "sm" | "md"
}) {
  const interactive = Boolean(onSelect)
  const hasProjected = projected !== undefined && projected > current + 0.05

  return (
    <div className="flex items-center">
      {LEVELS.map((level) => {
        const filled = level <= current
        const isExpected = level === expected
        const isProjected =
          hasProjected &&
          level === Math.min(PDI_MAX_LEVEL, Math.round(projected ?? current))
        const dot = (
          <span
            className={cn(
              "block rounded-full transition-colors",
              DOT_SIZE[size],
              filled ? "bg-brand" : "bg-muted",
              isExpected && "ring-2 ring-foreground/40 ring-offset-2 ring-offset-card",
              isProjected &&
                !filled &&
                "bg-brand/70 ring-2 ring-brand ring-offset-2 ring-offset-card"
            )}
          />
        )
        return (
          <div key={level} className="flex flex-1 items-center last:flex-none">
            {interactive ? (
              <button
                type="button"
                onClick={() => onSelect?.(level)}
                aria-label={`Definir nível ${formatPdiLevel(level)}${isExpected ? " (esperado)" : ""}`}
                aria-pressed={level === current}
                className="flex items-center justify-center rounded-full p-1.5"
              >
                {dot}
              </button>
            ) : (
              <span className="p-0.5">{dot}</span>
            )}
            {level < PDI_MAX_LEVEL ? (
              <span
                className={cn(
                  "h-0.5 flex-1",
                  level < current ? "bg-brand" : "bg-border"
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

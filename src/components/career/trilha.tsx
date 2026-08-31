import { Check } from "lucide-react"

import { TrilhaGauge } from "@/components/career/trilha-gauge"
import { StepConnector } from "@/components/ui/segmented-progress"
import { levelIndex } from "@/lib/profile/store"
import type { LevelDef } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

type LevelState = "done" | "current" | "future"
export type TrilhaVariant = "hero" | "detail" | "mini"

function stateFor(index: number, currentIndex: number): LevelState {
  if (index < currentIndex) return "done"
  if (index === currentIndex) return "current"
  return "future"
}

const NODE_SIZE = {
  sm: "size-6",
  lg: "size-8",
} as const

function TrilhaNode({
  level,
  state,
  variant,
  size,
  showCurrentHint,
}: {
  level: LevelDef
  state: LevelState
  variant: TrilhaVariant
  size: "sm" | "lg"
  showCurrentHint: boolean
}) {
  const nodeSize =
    variant === "mini" ? "size-2" : variant === "hero" ? "size-7" : NODE_SIZE[size]

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          nodeSize,
          state === "done" && "bg-primary text-primary-foreground",
          state === "current" &&
            "bg-primary text-primary-foreground ring-2 ring-primary/35 ring-offset-2 ring-offset-card motion-safe:animate-pulse",
          state === "future" && "border border-hairline-strong bg-muted"
        )}
      >
        {variant !== "mini" && state === "done" ? (
          <Check className={size === "lg" ? "size-4" : "size-3.5"} />
        ) : null}
        {variant !== "mini" && state === "current" ? (
          <span className={cn("rounded-full bg-primary-foreground", size === "lg" ? "size-2.5" : "size-2")} />
        ) : null}
      </div>
      {variant !== "mini" ? (
        <span
          className={cn(
            "label-mono whitespace-nowrap",
            state === "current" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {level.name}
        </span>
      ) : null}
      {showCurrentHint && state === "current" && variant !== "mini" ? (
        <span className="text-[10px] font-medium text-primary">você está aqui</span>
      ) : null}
    </div>
  )
}

/**
 * Trilha de carreira — o elemento-assinatura do Atlas.
 * `hero` abre a Início, `detail` vive no Perfil, `mini` fica fixa na sidebar
 * para que a posição na trilha esteja sempre visível.
 */
export function Trilha({
  ladder,
  currentLevelId,
  targetLevelId,
  readiness,
  variant = "detail",
  size = "sm",
  showCurrentHint = false,
  className,
}: {
  ladder: LevelDef[]
  currentLevelId: string
  targetLevelId?: string
  readiness?: number
  variant?: TrilhaVariant
  size?: "sm" | "lg"
  showCurrentHint?: boolean
  className?: string
}) {
  if (!ladder.length) return null

  const currentIndex = levelIndex(ladder, currentLevelId)
  const currentLevel = ladder[currentIndex]
  const targetLevel = targetLevelId
    ? ladder[levelIndex(ladder, targetLevelId)]
    : undefined

  const track = (
    <div className="flex items-start">
      {ladder.map((level, index) => (
        <div key={level.id} className="flex flex-1 items-start last:flex-none">
          <TrilhaNode
            level={level}
            state={stateFor(index, currentIndex)}
            variant={variant}
            size={size}
            showCurrentHint={showCurrentHint}
          />
          {index < ladder.length - 1 ? (
            <StepConnector
              filled={index < currentIndex}
              className={
                variant === "mini" ? "mt-1" : variant === "hero" ? "mt-3.5" : size === "lg" ? "mt-4" : "mt-3"
              }
            />
          ) : null}
        </div>
      ))}
    </div>
  )

  if (variant === "mini") {
    const label = targetLevel
      ? `${currentLevel?.name ?? ""} → ${targetLevel.name}`
      : (currentLevel?.name ?? "")
    return (
      <div className={cn("flex flex-col gap-1.5", className)} title={label}>
        <span className="label-mono text-muted-foreground">Trilha</span>
        {track}
        <span className="truncate text-[11px] text-muted-foreground">{label}</span>
      </div>
    )
  }

  if (variant === "hero") {
    return (
      <div className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
        <div className="min-w-0 flex-1">
          <span className="label-mono text-muted-foreground">Trilha de carreira</span>
          <p className="mt-1.5 text-lg font-semibold tracking-tight">
            {currentLevel?.name ?? "Seu nível atual"}
            {targetLevel ? (
              <span className="text-muted-foreground"> → {targetLevel.name}</span>
            ) : null}
          </p>
          <div className="mt-4">{track}</div>
        </div>
        {typeof readiness === "number" ? (
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <span className="label-mono text-muted-foreground">Prontidão</span>
            <p className="figure text-foreground">
              {Math.round(readiness)}
              <span className="ml-0.5 text-lg text-muted-foreground">%</span>
            </p>
            <TrilhaGauge value={readiness} className="h-10 w-36" />
          </div>
        ) : null}
      </div>
    )
  }

  return <div className={className}>{track}</div>
}

import { Check } from "lucide-react"

import type { LevelDef } from "@/lib/profile/types"
import { levelIndex } from "@/lib/profile/store"
import { cn } from "@/lib/utils"

type LevelState = "done" | "current" | "future"

const NODE_SIZE = {
  sm: "size-6",
  lg: "size-8",
} as const

const DOT_SIZE = {
  sm: "size-2",
  lg: "size-2.5",
} as const

function LevelNode({
  level,
  state,
  size,
  showCurrentHint,
}: {
  level: LevelDef
  state: LevelState
  size: "sm" | "lg"
  showCurrentHint: boolean
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div
        className={cn(
          "flex items-center justify-center rounded-full text-brand-foreground",
          NODE_SIZE[size],
          state === "done" && "bg-brand",
          state === "current" && "bg-brand ring-2 ring-brand/30 ring-offset-2 ring-offset-card",
          state === "future" && "border border-border bg-muted"
        )}
      >
        {state === "done" ? <Check className={size === "lg" ? "size-4" : "size-3.5"} /> : null}
        {state === "current" ? (
          <span className={cn("rounded-full bg-brand-foreground", DOT_SIZE[size])} />
        ) : null}
      </div>
      <span
        className={cn(
          "whitespace-nowrap",
          size === "lg" ? "text-xs" : "text-[11px]",
          state === "current" ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        {level.name}
      </span>
      {showCurrentHint && state === "current" ? (
        <span className="text-[10px] font-medium text-brand-muted-foreground">você está aqui</span>
      ) : null}
    </div>
  )
}

export function LadderStepper({
  ladder,
  currentLevelId,
  size = "sm",
  showCurrentHint = false,
}: {
  ladder: LevelDef[]
  currentLevelId: string
  size?: "sm" | "lg"
  showCurrentHint?: boolean
}) {
  const currentIndex = levelIndex(ladder, currentLevelId)
  const connectorOffset = size === "lg" ? "mt-4" : "mt-3"

  return (
    <div className="flex items-start">
      {ladder.map((level, index) => {
        const state: LevelState =
          index < currentIndex ? "done" : index === currentIndex ? "current" : "future"
        const isLast = index === ladder.length - 1
        return (
          <div key={level.id} className="flex flex-1 items-start last:flex-none">
            <LevelNode
              level={level}
              state={state}
              size={size}
              showCurrentHint={showCurrentHint}
            />
            {!isLast ? (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  connectorOffset,
                  index < currentIndex ? "bg-brand" : "bg-border"
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

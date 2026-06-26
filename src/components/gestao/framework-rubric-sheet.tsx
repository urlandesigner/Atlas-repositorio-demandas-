"use client"

import { Check } from "lucide-react"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatPdiLevel, PDI_MAX_LEVEL } from "@/lib/profile/pdi"
import type { FrameworkTheme } from "@/lib/gestao/pdi/types"
import { cn } from "@/lib/utils"

const LEVELS = Array.from({ length: PDI_MAX_LEVEL + 1 }, (_, i) => i)

export function FrameworkRubricSheet({
  theme,
  current,
  expected,
  onOpenChange,
  onSetExpected,
}: {
  theme: FrameworkTheme | null
  current: number
  expected: number
  onOpenChange: (open: boolean) => void
  onSetExpected?: (level: number) => void
}) {
  const editable = Boolean(onSetExpected)

  return (
    <Sheet open={Boolean(theme)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {theme ? (
          <>
            <SheetHeader>
              <SheetTitle>{theme.label}</SheetTitle>
              <SheetDescription>
                {editable
                  ? "Toque num nível para definir o esperado neste degrau da trilha."
                  : "Referência de níveis da trilha."}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-1.5 p-4 pt-0">
              {LEVELS.map((level) => {
                const isCurrent = level === current
                const isExpected = level === expected
                const body = (
                  <>
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                        isCurrent
                          ? "bg-brand text-brand-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {formatPdiLevel(level)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{theme.rubric[level] ?? "—"}</span>
                      <span className="mt-0.5 flex flex-wrap gap-1.5">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-muted-foreground">
                            <Check className="size-3" /> nível atual
                          </span>
                        ) : null}
                        {isExpected ? (
                          <span className="text-[11px] font-medium text-foreground/70">
                            esperado
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </>
                )

                if (!editable) {
                  return (
                    <div
                      key={level}
                      className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-2.5"
                    >
                      {body}
                    </div>
                  )
                }

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onSetExpected?.(level)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      isExpected
                        ? "border-brand/40 bg-brand-muted/50"
                        : "border-border/60 hover:bg-muted/40"
                    )}
                  >
                    {body}
                  </button>
                )
              })}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

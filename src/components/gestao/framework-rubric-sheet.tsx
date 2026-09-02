"use client"

import { Check } from "lucide-react"

import { OptionCard } from "@/components/ui/option-card"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
      <SheetContent className="w-full gap-0 overflow-y-auto" size="md">
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

            <SheetBody className="gap-1.5">
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
                          <span className="inline-flex items-center gap-1 text-2xs font-medium text-brand-muted-foreground">
                            <Check className="size-3" /> nível atual
                          </span>
                        ) : null}
                        {isExpected ? (
                          <span className="text-2xs font-medium text-foreground/70">
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
                  <OptionCard
                    key={level}
                    active={isExpected}
                    onClick={() => onSetExpected?.(level)}
                    className="flex items-start gap-3"
                  >
                    {body}
                  </OptionCard>
                )
              })}
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

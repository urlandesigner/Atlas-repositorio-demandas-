"use client"

import { Check } from "lucide-react"

import { OptionCard } from "@/components/ui/option-card"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  formatPdiLevel,
  PDI_MAX_LEVEL,
  PDI_RUBRIC,
  PDI_THEME_LABEL,
  type PdiTheme,
} from "@/lib/profile/pdi"
import { cn } from "@/lib/utils"

const LEVELS = Array.from({ length: PDI_MAX_LEVEL + 1 }, (_, i) => i)

export function PdiRubricSheet({
  theme,
  current,
  expected,
  onOpenChange,
  onSetExpected,
}: {
  theme: PdiTheme | null
  current: number
  expected: number
  onOpenChange: (open: boolean) => void
  onSetExpected: (level: number) => void
}) {
  return (
    <Sheet open={Boolean(theme)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto" size="md">
        {theme ? (
          <>
            <SheetHeader>
              <SheetTitle>{PDI_THEME_LABEL[theme]}</SheetTitle>
              <SheetDescription>
                Escala 0–6. Toque num nível para definir o esperado deste tema.
              </SheetDescription>
            </SheetHeader>

            <SheetBody className="gap-1.5">
              {LEVELS.map((level) => {
                const isCurrent = level === current
                const isExpected = level === expected
                return (
                  <OptionCard
                    key={level}
                    active={isExpected}
                    onClick={() => onSetExpected(level)}
                    className="flex items-start gap-3"
                  >
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
                      <span className="block text-sm">{PDI_RUBRIC[theme][level]}</span>
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

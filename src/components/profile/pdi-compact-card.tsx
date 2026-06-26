import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PdiLevelTrack } from "@/components/profile/pdi-level-track"
import type { ObjectiveEntry } from "@/lib/objectives/store"
import {
  countThemesWithObjectiveAdvance,
  formatPdiLevel,
  PDI_THEMES,
  PDI_THEME_LABEL,
  type PdiTheme,
} from "@/lib/profile/pdi"
import { cn } from "@/lib/utils"

export function PdiCompactCard({
  baseline,
  projected,
  expected,
  baselineAt,
  objectives,
}: {
  baseline: Record<PdiTheme, number>
  projected: Record<PdiTheme, number>
  expected: Record<PdiTheme, number>
  baselineAt: string
  objectives: ObjectiveEntry[]
}) {
  const advancing = countThemesWithObjectiveAdvance(baseline, objectives, expected)
  const baselineDate = new Date(baselineAt).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  })

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-sm font-medium">Último PDI</CardTitle>
          <p className="text-xs text-muted-foreground">
            Referência de {baselineDate} · detalhe e avanço em Evolução
          </p>
        </div>
        <Link
          href="/professional/evolution/radar"
          className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand-muted-foreground underline-offset-2 hover:underline"
        >
          Ver matrizes
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {PDI_THEMES.map((theme) => {
            const level = baseline[theme] ?? 0
            const target = expected[theme] ?? 0
            const projectedLevel = projected[theme] ?? level
            const hasAdvance = projectedLevel - level >= 0.15
            const met = level >= target
            return (
              <div key={theme} className="flex items-center gap-3">
                <span className="w-20 shrink-0 truncate text-sm">{PDI_THEME_LABEL[theme]}</span>
                <div className="min-w-0 flex-1">
                  <PdiLevelTrack
                    current={level}
                    expected={target}
                    projected={hasAdvance ? projectedLevel : undefined}
                    size="sm"
                  />
                </div>
                <span
                  className={cn(
                    "w-14 shrink-0 text-right text-xs tabular-nums",
                    met ? "text-brand-muted-foreground" : "text-muted-foreground"
                  )}
                >
                  {formatPdiLevel(level)}
                  {hasAdvance ? (
                    <span className="text-brand-muted-foreground">
                      →{formatPdiLevel(Math.round(projectedLevel))}
                    </span>
                  ) : null}
                </span>
              </div>
            )
          })}
        </div>
        {advancing > 0 ? (
          <p className="mt-3 text-xs text-brand-muted-foreground">
            {advancing} tema(s) com avanço estimado via objetivos
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

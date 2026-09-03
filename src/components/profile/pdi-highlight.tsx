import Link from "next/link"
import { ArrowUpRight, CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import {
  computeFrameworkReadiness,
  getFrameworkExpectations,
  type PdiAssignment,
  type PdiFramework,
} from "@/lib/gestao/pdi/types"
import {
  formatPdiScheduleDate,
  getDaysUntilPdi,
  getNextPdiDate,
  getNextPdiStatusText,
  getNextPdiTone,
} from "@/lib/profile/pdi-schedule"

const TONE_CLASSNAME = {
  neutral: "border-border/70 bg-card text-foreground",
  warning: "border-warning/20 bg-warning/10 text-warning-foreground",
  critical: "border-destructive/20 bg-destructive/10 text-danger-foreground",
} as const

const BADGE_TONE: Record<keyof typeof TONE_CLASSNAME, StatusTone> = {
  neutral: "neutral",
  warning: "warning",
  critical: "danger",
}

/**
 * Cartão de PDI do Resumo.
 *
 * Passou a liderar com o ciclo MAIS RECENTE em vez de com a data prevista do
 * próximo. A previsão é dado derivado — `baselineAt` mais uma cadência
 * semestral — e ocupava o cartão inteiro dizendo o que a própria legenda
 * admitia ser estimativa. O ciclo mais recente é fato: tem rótulo, data de
 * avaliação e avanço medido.
 *
 * A previsão ficou, como uma linha: "quando é o próximo" continua sendo
 * pergunta legítima, só não merecia ser a manchete.
 *
 * Sem ciclo em mãos o cartão volta ao comportamento anterior, porque quem nunca
 * recebeu PDI ainda assim tem uma data prevista a partir do baseline.
 */
export function PdiHighlight({
  baselineAt,
  cicloRecente,
  framework,
  className,
  compact = false,
}: {
  baselineAt: string
  /** O ciclo no topo da lista: ativo primeiro, depois o encerrado mais recente. */
  cicloRecente?: PdiAssignment
  framework?: PdiFramework
  className?: string
  compact?: boolean
}) {
  const nextPdiDate = getNextPdiDate(baselineAt)
  const daysUntil = getDaysUntilPdi(nextPdiDate)
  const tone = getNextPdiTone(daysUntil)

  const avanco =
    cicloRecente && framework
      ? computeFrameworkReadiness(
          Object.fromEntries(
            Object.entries(cicloRecente.current).map(([tema, valor]) => [tema, valor.level])
          ),
          getFrameworkExpectations(framework, cicloRecente.currentLevelId),
          framework.themes.map((tema) => tema.id)
        )
      : null

  const avaliadoEm = cicloRecente?.evaluation?.evaluatedAt ?? cicloRecente?.updatedAt

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-4",
        TONE_CLASSNAME[tone],
        compact
          ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          : "flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-current/10 bg-background/70">
          <CalendarDays className="size-4" />
        </div>
        <div className="min-w-0">
          {cicloRecente ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tracking-tight">
                  {cicloRecente.cycleLabel}
                </p>
                <Badge variant={cicloRecente.status === "active" ? "outline" : "secondary"}>
                  {cicloRecente.status === "active" ? "Ativo" : "Encerrado"}
                </Badge>
              </div>
              <p className="mt-1 text-base font-medium">
                {avanco === null ? "—" : `${avanco}% de avanço`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {avaliadoEm
                  ? `Avaliado em ${formatPdiScheduleDate(avaliadoEm)}. `
                  : ""}
                Próximo previsto para {formatPdiScheduleDate(nextPdiDate)} —{" "}
                {getNextPdiStatusText(daysUntil).toLowerCase()}.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tracking-tight">Próximo PDI</p>
                <StatusBadge tone={BADGE_TONE[tone]}>
                  {getNextPdiStatusText(daysUntil)}
                </StatusBadge>
              </div>
              <p className="mt-1 text-base font-medium">
                {formatPdiScheduleDate(nextPdiDate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Previsão calculada a partir do último PDI formal, considerando cadência
                semestral.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Aponta para a tela de histórico, não para a âncora #pdi da própria
          página: com mais de um ciclo, "ver PDIs" quer dizer ver todos. */}
      <Link
        href="/professional/evolution/pdi"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {cicloRecente ? "Ver PDIs" : "Ver PDI"}
        <ArrowUpRight data-icon="inline-end" />
      </Link>
    </div>
  )
}

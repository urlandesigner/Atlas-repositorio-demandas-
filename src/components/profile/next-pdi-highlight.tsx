import Link from "next/link"
import { ArrowUpRight, CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  formatPdiScheduleDate,
  getDaysUntilPdi,
  getNextPdiDate,
  getNextPdiStatusText,
  getNextPdiTone,
} from "@/lib/profile/pdi-schedule"

const TONE_CLASSNAME = {
  neutral: "border-border/70 bg-card text-foreground",
  warning: "border-amber-300/70 bg-amber-50 text-amber-950",
  critical: "border-rose-300/70 bg-rose-50 text-rose-950",
} as const

const BADGE_CLASSNAME = {
  neutral: "border-border/70 bg-background text-foreground",
  warning: "border-amber-300/70 bg-amber-100 text-amber-900",
  critical: "border-rose-300/70 bg-rose-100 text-rose-900",
} as const

export function NextPdiHighlight({
  baselineAt,
  className,
  compact = false,
}: {
  baselineAt: string
  className?: string
  compact?: boolean
}) {
  const nextPdiDate = getNextPdiDate(baselineAt)
  const daysUntil = getDaysUntilPdi(nextPdiDate)
  const tone = getNextPdiTone(daysUntil)

  return (
    <div
      className={cn(
        "rounded-[12px] border px-4 py-4",
        TONE_CLASSNAME[tone],
        compact ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" : "flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-current/10 bg-background/70">
          <CalendarDays className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold tracking-tight">Próximo PDI</p>
            <Badge variant="outline" className={cn("font-normal", BADGE_CLASSNAME[tone])}>
              {getNextPdiStatusText(daysUntil)}
            </Badge>
          </div>
          <p className="mt-1 text-base font-medium">
            {formatPdiScheduleDate(nextPdiDate)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Previsão calculada a partir do último PDI formal, considerando cadência semestral.
          </p>
        </div>
      </div>

      <Link
        href="/professional/evolution/radar"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Ver PDI
        <ArrowUpRight data-icon="inline-end" />
      </Link>
    </div>
  )
}

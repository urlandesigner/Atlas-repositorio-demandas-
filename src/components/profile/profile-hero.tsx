import Link from "next/link"
import { ArrowRight, Building2, Clock3, TrendingUp, Users, type LucideIcon } from "lucide-react"

import { Trilha } from "@/components/career/trilha"
import { buttonVariants } from "@/components/ui/button"
import { BrandSurface } from "@/components/ui/brand-surface"
import { PersonAvatar } from "@/components/ui/person-avatar"
import { StatLink } from "@/components/ui/stat-link"
import type { PdiAssignment } from "@/lib/gestao/pdi/types"
import { formatTenure } from "@/lib/profile/store"
import { getDaysUntilPdi, getNextPdiDate, getNextPdiTone } from "@/lib/profile/pdi-schedule"
import type { CareerGoal, LevelDef, ProfileIdentity } from "@/lib/profile/types"
import { cn } from "@/lib/utils"

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/15 bg-card/40 px-2.5 py-1 text-xs text-brand-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}

function shortDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

const DAYS_TONE = {
  neutral: "",
  warning: "text-warning-foreground!",
  critical: "text-danger-foreground!",
} as const

/**
 * Destaque de Meu Perfil, na mesma superfície de marca das telas-casa.
 *
 * Junta o que antes eram três cartões soltos: a identidade (um card pequeno no
 * topo, do mesmo peso do card de PDI ao lado), o card do ciclo de PDI e o
 * objetivo de carreira, que ficava no fim da página. Os dois últimos diziam o
 * mesmo "78%" em lugares diferentes; aqui o número aparece uma vez, com a
 * fonte e o ciclo de onde vem.
 */
export function ProfileHero({
  identity,
  levelName,
  avatarUrl,
  goal,
  ladder,
  currentLevelId,
  readiness,
  baselineAt,
  cicloRecente,
}: {
  identity: ProfileIdentity
  levelName: string
  avatarUrl?: string | null
  goal: CareerGoal
  ladder: LevelDef[]
  currentLevelId: string
  readiness: number
  baselineAt: string
  cicloRecente?: PdiAssignment
}) {
  const tenure = formatTenure(identity.startDate)
  const nextPdi = getNextPdiDate(baselineAt)
  const daysUntil = getDaysUntilPdi(nextPdi)
  const tone = getNextPdiTone(daysUntil)
  const evaluatedAt = cicloRecente?.evaluation?.evaluatedAt ?? cicloRecente?.updatedAt
  const cycleHelper = cicloRecente
    ? `${cicloRecente.cycleLabel}${evaluatedAt ? ` · avaliado em ${shortDate(evaluatedAt)}` : ""}`
    : "Pelo nível avaliado"

  return (
    <BrandSurface labelledBy="profile-hero-title">
      <div className="grid gap-8 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-12">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <PersonAvatar
            name={identity.name}
            imageUrl={avatarUrl}
            size="3xl"
            className="shrink-0 ring-2 ring-brand/30"
          />
          <div className="min-w-0">
            <h2
              id="profile-hero-title"
              className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              {identity.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {identity.role}
              {levelName ? ` · ${levelName}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip icon={Building2}>{identity.area}</Chip>
              <Chip icon={Users}>Squad {identity.squad}</Chip>
              {tenure ? <Chip icon={Clock3}>{tenure}</Chip> : null}
            </div>
          </div>
        </div>

        <div className="min-w-0 xl:text-right">
          <span className="label-mono text-brand-muted-foreground">Objetivo de carreira</span>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            {goal.targetRole}
          </p>
          {goal.targetYear ? (
            <p className="mt-0.5 text-sm text-muted-foreground">meta {goal.targetYear}</p>
          ) : null}
        </div>
      </div>

      <div className="px-6 pb-7 lg:px-8">
        <Trilha ladder={ladder} currentLevelId={currentLevelId} size="lg" />
      </div>

      <div className="flex flex-col gap-6 border-t border-brand/15 px-6 py-5 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid grid-cols-1 gap-6 min-[420px]:grid-cols-2 lg:gap-12">
          <StatLink
            href="/professional/evolution/pdi"
            label="Avanço no PDI"
            value={`${Math.round(readiness)}%`}
            helper={cycleHelper}
            className="-m-3 rounded-lg p-3 hover:bg-brand/[0.06]"
            labelClassName="text-brand-muted-foreground"
          />
          <StatLink
            href="/professional/evolution/pdi"
            label={daysUntil < 0 ? "PDI atrasado" : "Próximo PDI"}
            value={
              <span className={cn(DAYS_TONE[tone])}>
                {Math.abs(daysUntil)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {Math.abs(daysUntil) === 1 ? "dia" : "dias"}
                </span>
              </span>
            }
            helper={
              daysUntil < 0
                ? `Previsto para ${shortDate(nextPdi)}`
                : `Previsto para ${shortDate(nextPdi)}, a cada 6 meses`
            }
            className="-m-3 rounded-lg p-3 hover:bg-brand/[0.06]"
            labelClassName="text-brand-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/professional/evolution/pdi"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver PDIs
            <ArrowRight data-icon="inline-end" />
          </Link>
          <Link
            href="/professional/evolution/radar"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <TrendingUp data-icon="inline-start" />
            Competências
          </Link>
        </div>
      </div>
    </BrandSurface>
  )
}

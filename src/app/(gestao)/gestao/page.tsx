"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import { ArrowRight, Flag, Users } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  CardList,
  CardListBody,
  CardListHeader,
} from "@/components/ui/card-list"
import { buttonVariants } from "@/components/ui/button"
import {
  AttentionColumn,
  AttentionRow,
  BrandSurface,
  BrandSurfaceHeading,
} from "@/components/ui/brand-surface"
import { PageHeader } from "@/components/ui/page-header"
import { Stat, StatStrip } from "@/components/ui/stat-strip"
import { PersonAvatar } from "@/components/ui/person-avatar"
import {
  getGestaoObjectivesServerSnapshot,
  getGestaoObjectivesSnapshot,
  OBJECTIVE_STATUS_LABEL,
  subscribeGestaoObjectivesStore,
} from "@/lib/gestao/objectives/store"
import {
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import { OBJECTIVE_STATUS_TONE } from "@/lib/status-tone"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"

export default function GestaoHomePage() {
  const { session } = useAuth()
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const pdiData = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )
  const [nowTs] = useState(() => Date.now())
  const objectivesData = useSyncExternalStore(
    subscribeGestaoObjectivesStore,
    getGestaoObjectivesSnapshot,
    getGestaoObjectivesServerSnapshot
  )

  const directReports = useMemo(() => {
    if (!session) return []
    return org.users.filter((user) => user.managerId === session.userId)
  }, [org.users, session])

  const directReportIds = useMemo(
    () => new Set(directReports.map((user) => user.id)),
    [directReports]
  )

  const activePdis = useMemo(
    () =>
      pdiData.assignments.filter(
        (assignment) =>
          assignment.status === "active" && directReportIds.has(assignment.userId)
      ).length,
    [directReportIds, pdiData.assignments]
  )

  const pendingRequests = useMemo(
    () =>
      pdiData.promotionRequests.filter(
        (request) => request.managerId === session?.userId && request.status === "pending"
      ),
    [pdiData.promotionRequests, session?.userId]
  )

  const teamObjectives = useMemo(() => {
    if (!session) return []
    return objectivesData
      .filter((objective) => objective.managerId === session.userId)
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === "in_progress") return -1
          if (b.status === "in_progress") return 1
        }
        return (a.deadline ?? "9999-99-99").localeCompare(b.deadline ?? "9999-99-99")
      })
  }, [objectivesData, session])

  const dueSoonGoals = useMemo(() => {
    return teamObjectives.filter((objective) => {
      if (!objective.deadline) return false
      const diff = new Date(objective.deadline).getTime() - nowTs
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 30
    })
  }, [nowTs, teamObjectives])

  const activeGoals = teamObjectives.filter((objective) => objective.status === "in_progress").length
  const attentionParts = [
    pendingRequests.length
      ? `${pendingRequests.length} ${pendingRequests.length === 1 ? "pendência de PDI" : "pendências de PDI"}`
      : null,
    dueSoonGoals.length
      ? `${dueSoonGoals.length} ${dueSoonGoals.length === 1 ? "meta vence" : "metas vencem"} em 30 dias`
      : null,
  ].filter((part): part is string => Boolean(part))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visão geral"
        description="O que pede sua atenção, como o time está e o que vem pela frente."
      />

      {/* Mesma superfície de marca do Início e da Visão geral do admin: a casa
          de cada papel abre com o que pede atenção. Antes eram quatro números
          soltos, e a única pista de pendência era a linha cinza do cabeçalho. */}
      <BrandSurface labelledBy="gestao-attention-title">
        <BrandSurfaceHeading
          id="gestao-attention-title"
          label="Pede sua atenção"
          parts={attentionParts}
          empty="Time em dia"
        />

        <div className="grid gap-6 p-6 lg:grid-cols-2 lg:gap-8 lg:p-8">
          <AttentionColumn
            title="Pendências de PDI"
            count={pendingRequests.length}
            footerHref="/gestao/pdi"
            footerLabel="Abrir PDIs"
            emptyText="Nenhuma subida aguardando você."
          >
            {pendingRequests.slice(0, 4).map((request) => {
              const assignment = pdiData.assignments.find((entry) => entry.id === request.assignmentId)
              const framework = assignment
                ? pdiData.frameworks.find((entry) => entry.id === assignment.frameworkId)
                : undefined
              const user = directReports.find((report) => report.id === request.userId)
              const fromName =
                framework?.ladder.find((level) => level.id === request.fromLevelId)?.name ?? "—"
              const toName =
                framework?.ladder.find((level) => level.id === request.toLevelId)?.name ?? "—"

              return (
                <AttentionRow
                  key={request.id}
                  href={`/gestao/liderados/${request.userId}`}
                  name={user?.name ?? "Colaborador"}
                  avatarUrl={user?.avatarUrl}
                  meta={`${fromName} → ${toName}`}
                  trailing={
                    <Badge variant={request.readiness >= 80 ? "default" : "outline"}>
                      {request.readiness}% pronto
                    </Badge>
                  }
                />
              )
            })}
          </AttentionColumn>

          <AttentionColumn
            title="Vencem em 30 dias"
            count={dueSoonGoals.length}
            footerHref="/gestao/objetivos"
            footerLabel="Abrir metas do time"
            emptyText="Nenhuma meta perto do prazo."
          >
            {dueSoonGoals.slice(0, 4).map((objective) => {
              const user = directReports.find((report) => report.id === objective.userId)
              return (
                <AttentionRow
                  key={objective.id}
                  href={`/gestao/liderados/${objective.userId}`}
                  name={user?.name ?? "Colaborador"}
                  avatarUrl={user?.avatarUrl}
                  meta={`${objective.title} · ${formatDeadline(objective.deadline)}`}
                />
              )
            })}
          </AttentionColumn>
        </div>
      </BrandSurface>

      <StatStrip aria-label="Números do time">
        <Stat href="/gestao/liderados" label="Pessoas do time" value={directReports.length} helper="Sob sua gestão direta" />
        <Stat href="/gestao/pdi" label="PDIs ativos" value={activePdis} helper="Com trilha em andamento" />
        <Stat href="/gestao/objetivos" label="Metas ativas" value={activeGoals} helper="Em execução agora" />
        <Stat href="/gestao/objetivos" label="Prazo próximo" value={dueSoonGoals.length} helper="Vencem em até 30 dias" />
      </StatStrip>

      {/* Colunas de jornal, como no Início e no Admin: as duas listas têm
          altura que depende do time, e em grade sobrava buraco. */}
      <div className="columns-1 gap-4 *:mb-4 *:break-inside-avoid xl:columns-2 -mb-4">
        <CardList>
          <CardListHeader
            title="Meu time"
            icon={<Users />}
            action={
              <Link href="/gestao/liderados" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ver time completo
                <ArrowRight data-icon="inline-end" />
              </Link>
            }
          />
          <CardListBody className="divide-y divide-border/60 px-2 pb-2">
            {directReports.length ? (
              directReports.slice(0, 6).map((user) => (
                <Link
                  key={user.id}
                  href={`/gestao/liderados/${user.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-4 py-3.5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PersonAvatar name={user.name} imageUrl={user.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {user.role === "gestor" ? "Gestor" : user.role === "admin" ? "Admin" : "Colaborador"}
                  </Badge>
                </Link>
              ))
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma pessoa no seu time ainda.
              </p>
            )}
          </CardListBody>
        </CardList>

        <CardList>
          <CardListHeader
            title="Metas do time"
            icon={<Flag />}
            action={
              <Link href="/gestao/objetivos" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Abrir metas
                <ArrowRight data-icon="inline-end" />
              </Link>
            }
          />
          <CardListBody className="divide-y divide-border/60 px-2 pb-2">
            {teamObjectives.length ? (
              teamObjectives.slice(0, 6).map((objective) => {
                const user = directReports.find((report) => report.id === objective.userId)
                return (
                  <div key={objective.id} className="flex flex-col gap-2 px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{objective.title}</p>
                      <StatusBadge tone={OBJECTIVE_STATUS_TONE[objective.status]}>
                        {OBJECTIVE_STATUS_LABEL[objective.status]}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <PersonAvatar name={user?.name ?? "Colaborador"} imageUrl={user?.avatarUrl} size="sm" />
                      <p>
                        {user?.name ?? "Colaborador"} · {formatDeadline(objective.deadline)}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma meta cadastrada para o time ainda.
              </p>
            )}
          </CardListBody>
        </CardList>
      </div>
    </div>
  )
}

/** "2026-07-19" vira "prazo 19 de jul."; sem prazo, diz isso. */
function formatDeadline(deadline: string | null | undefined) {
  if (!deadline) return "sem prazo definido"
  const date = new Date(`${deadline.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return `prazo ${deadline}`
  return `prazo ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
}

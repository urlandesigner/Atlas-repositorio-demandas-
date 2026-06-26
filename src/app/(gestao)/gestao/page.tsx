"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import { ArrowUpRight, Flag, Target, Users } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import {
  getGestaoObjectivesServerSnapshot,
  getGestaoObjectivesSnapshot,
  OBJECTIVE_STATUS_LABEL,
  subscribeGestaoObjectivesStore,
} from "@/lib/gestao/objectives/store"
import { cn } from "@/lib/utils"
import {
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
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
      ).length,
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
    }).length
  }, [nowTs, teamObjectives])

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[18px] border border-border/55 bg-card px-6 py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Gestão
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Visão geral do time</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Veja quem precisa de acompanhamento, quais metas estão ativas e onde vale agir
              primeiro nesta semana.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{directReports.length} pessoa(s)</Badge>
            <Badge variant="outline">{teamObjectives.length} meta(s)</Badge>
            <Badge variant={pendingRequests ? "secondary" : "outline"}>
              {pendingRequests} pendência(s)
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <GestaoMetric
          label="Pessoas do time"
          value={directReports.length}
          helper="Base que você acompanha"
        />
        <GestaoMetric
          label="PDIs ativos"
          value={activePdis}
          helper="Pessoas com desenvolvimento em andamento"
        />
        <GestaoMetric
          label="Metas ativas"
          value={teamObjectives.filter((objective) => objective.status === "in_progress").length}
          helper="Objetivos em execução agora"
        />
        <GestaoMetric
          label="Prazo próximo"
          value={dueSoonGoals}
          helper="Metas que vencem em até 30 dias"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Meu time</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Pessoas sob sua gestão e acesso rápido para abrir cada ficha.
              </p>
            </div>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {directReports.length ? (
              directReports.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 rounded-[12px] border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {user.role === "gestor"
                        ? "Gestor"
                        : user.role === "admin"
                          ? "Admin"
                          : "Colaborador"}
                    </Badge>
                    <Link
                      href={`/gestao/liderados/${user.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Abrir ficha
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-1 py-10 text-center text-sm text-muted-foreground">
                Nenhuma pessoa vinculada ao seu time ainda.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/gestao/liderados" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ver time completo
              </Link>
              <Link href="/gestao/colaboradores" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Cadastro do time
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Metas do time</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                O que está em andamento e o que pede atenção mais perto do prazo.
              </p>
            </div>
            <Flag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {teamObjectives.length ? (
              teamObjectives.slice(0, 5).map((objective) => {
                const user = directReports.find((report) => report.id === objective.userId)
                return (
                  <div
                    key={objective.id}
                    className="flex flex-col gap-2 rounded-[12px] border border-border/60 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{objective.title}</p>
                      <Badge variant="outline">{OBJECTIVE_STATUS_LABEL[objective.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user?.name ?? "Colaborador"}
                      {objective.deadline ? ` · prazo ${objective.deadline}` : " · sem prazo definido"}
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="px-1 py-10 text-center text-sm text-muted-foreground">
                Nenhuma meta cadastrada para o time ainda.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/gestao/objetivos" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Abrir metas do time
              </Link>
              <Link href="/gestao/pdi" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Abrir PDIs
              </Link>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
              >
                Área profissional
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-medium">Ações do dia</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Atalhos úteis para atualizar cadastros, PDIs e o acompanhamento do time.
            </p>
          </div>
          <Target className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/gestao/liderados" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Meu time
          </Link>
          <Link href="/gestao/colaboradores" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cadastro do time
          </Link>
          <Link href="/gestao/pdi" className={buttonVariants({ variant: "outline", size: "sm" })}>
            PDIs
          </Link>
          <Link href="/gestao/objetivos" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Metas do time
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function GestaoMetric({
  label,
  value,
  helper,
}: {
  label: string
  value: number
  helper: string
}) {
  return (
    <div className="rounded-[12px] border border-border/60 bg-card/72 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

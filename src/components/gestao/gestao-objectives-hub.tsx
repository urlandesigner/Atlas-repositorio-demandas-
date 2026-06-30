"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import { ArrowUpRight } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRow,
  CardListRowMeta,
  CardListRowTitle,
} from "@/components/ui/card-list"
import { buttonVariants } from "@/components/ui/button"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import {
  getGestaoObjectivesServerSnapshot,
  getGestaoObjectivesSnapshot,
  OBJECTIVE_STATUS_LABEL,
  PDI_DIMENSION_LABEL,
  subscribeGestaoObjectivesStore,
} from "@/lib/gestao/objectives/store"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"

export function GestaoObjectivesHub() {
  const { session } = useAuth()
  const [nowTs] = useState(() => Date.now())
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const objectivesData = useSyncExternalStore(
    subscribeGestaoObjectivesStore,
    getGestaoObjectivesSnapshot,
    getGestaoObjectivesServerSnapshot
  )

  const directReports = useMemo(() => {
    if (!session) return []
    return org.users.filter((user) => user.managerId === session.userId)
  }, [org.users, session])

  const objectives = useMemo(() => {
    if (!session) return []
    return objectivesData.filter((objective) => objective.managerId === session.userId)
  }, [objectivesData, session])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Metas do time</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Objetivos ativos do seu time, ligados ao ciclo atual de desenvolvimento.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric
          label="Metas ativas"
          value={objectives.filter((objective) => objective.status === "in_progress").length}
          helper="Em execução agora"
        />
        <Metric
          label="Pessoas com meta"
          value={new Set(objectives.map((objective) => objective.userId)).size}
          helper="Cobertura do time"
        />
        <Metric
          label="Prazo próximo"
          value={objectives.filter((objective) => {
            if (!objective.deadline) return false
            const diff = new Date(objective.deadline).getTime() - nowTs
            return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 30
          }).length}
          helper="Vence nos próximos 30 dias"
        />
      </div>

      <CardList>
        <CardListHeader
          title="Lista de acompanhamento"
          description="Status, prazo e vínculo com a ficha de cada pessoa."
          action={<Badge variant="outline">{objectives.length} registros</Badge>}
        />
        <CardListBody>
          {objectives.map((objective) => {
            const user = directReports.find((report) => report.id === objective.userId)
            return (
              <CardListRow
                key={objective.id}
                className="border-t border-border/60 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardListRowTitle>{objective.title}</CardListRowTitle>
                    <Badge variant="outline">{OBJECTIVE_STATUS_LABEL[objective.status]}</Badge>
                  </div>
                  <CardListRowMeta>
                    {user?.name ?? "Colaborador"}
                    {objective.deadline ? ` · prazo ${objective.deadline}` : " · sem prazo definido"}
                  </CardListRowMeta>
                  {objective.dimensions.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {objective.dimensions.map((dimension) => (
                        <Badge key={dimension} variant="secondary">
                          {PDI_DIMENSION_LABEL[dimension]}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 lg:justify-end">
                  {user ? (
                    <Link
                      href={`/gestao/liderados/${user.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Abrir ficha
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  ) : null}
                </div>
              </CardListRow>
            )
          })}
          {!objectives.length ? (
            <div className="px-4 py-4">
              <EmptyStateCard
                title="Nenhuma meta do time cadastrada ainda"
                description="Metas aparecem aqui depois de criadas na ficha de cada pessoa."
                action={
                  <Link
                    href="/gestao/liderados"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Ir para meu time
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                }
              />
            </div>
            ) : null}
        </CardListBody>
      </CardList>
    </div>
  )
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string
  value: number
  helper: string
}) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card/65 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import { ArrowUpRight, Copy, Layers, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRow,
  CardListRowMeta,
  CardListRows,
  CardListRowTitle,
} from "@/components/ui/card-list"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  computeFrameworkReadiness,
  getFrameworkExpectations,
} from "@/lib/gestao/pdi/types"
import {
  deleteFramework,
  duplicateFramework,
  getFrameworkById,
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import {
  getPermissionsServerSnapshot,
  getPermissionsSnapshot,
  subscribePermissionsStore,
} from "@/lib/gestao/permissions/store"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  getOrgUserById,
  subscribeOrgStore,
} from "@/lib/org/store"
import { cn } from "@/lib/utils"

export function GestaoPdiHub() {
  const { session } = useAuth()
  const pdiData = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const permissionsData = useSyncExternalStore(
    subscribePermissionsStore,
    getPermissionsSnapshot,
    getPermissionsServerSnapshot
  )
  const sessionUserId = session?.userId ?? null

  const canEditFrameworks =
    session?.areaId && session.role
      ? session.role === "admin"
        ? true
        : session.role !== "gestor"
          ? false
          : (permissionsData.find((entry) => entry.areaId === session.areaId)
              ?.gestorCanEditFrameworks ?? true)
      : false

  const directReportIds = useMemo(
    () =>
      new Set(
        sessionUserId
          ? org.users.filter((user) => user.managerId === sessionUserId).map((user) => user.id)
          : []
      ),
    [org.users, sessionUserId]
  )

  const activeAssignments = useMemo(
    () =>
      pdiData.assignments.filter(
        (assignment) =>
          assignment.status === "active" && directReportIds.has(assignment.userId)
      ),
    [directReportIds, pdiData.assignments]
  )

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const averageReadiness = useMemo(() => {
    if (!activeAssignments.length) return 0
    const total = activeAssignments.reduce((sum, assignment) => {
      const framework = getFrameworkById(assignment.frameworkId)
      if (!framework) return sum
      const currentLevels = Object.fromEntries(
        framework.themes.map((theme) => [theme.id, assignment.current[theme.id]?.level ?? 0])
      )
      const expected = getFrameworkExpectations(framework, assignment.currentLevelId)
      return (
        sum +
        computeFrameworkReadiness(
          currentLevels,
          expected,
          framework.themes.map((theme) => theme.id)
        )
      )
    }, 0)

    return Math.round(total / activeAssignments.length)
  }, [activeAssignments])

  function handleDuplicate(id: string) {
    try {
      duplicateFramework(id, session?.userId ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível duplicar.")
    }
  }

  function confirmDelete() {
    if (!deletingId) return
    try {
      deleteFramework(deletingId)
      setDeletingId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">PDIs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize trilhas da área e acompanhe quem já está evoluindo no ciclo atual.
          </p>
        </div>
        <Link
          href="/gestao/pdi/frameworks/novo"
          className={cn(buttonVariants(), "gap-1.5", !canEditFrameworks && "pointer-events-none opacity-50")}
          aria-disabled={!canEditFrameworks}
          onClick={(event) => {
            if (!canEditFrameworks) event.preventDefault()
          }}
        >
          <Plus className="size-4" />
          Nova trilha
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <HubMetric label="Trilhas disponíveis" value={pdiData.frameworks.length} helper="Bases prontas para aplicar no time" />
        <HubMetric label="PDIs ativos" value={activeAssignments.length} helper="Pessoas com acompanhamento em andamento" />
        <HubMetric label="Prontidão média" value={averageReadiness} helper="Média atual do time em %" suffix="%" />
      </div>

      <section className="flex flex-col gap-3">
        <CardList>
          <CardListHeader
            title="Trilhas disponíveis"
            description="Bases prontas para aplicar ou revisar no desenvolvimento do time."
            action={<Badge variant="outline">{pdiData.frameworks.length}</Badge>}
          />
          <CardListBody>
            {pdiData.frameworks.length ? (
              <CardListRows>
                {pdiData.frameworks.map((framework) => (
                  <CardListRow key={framework.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardListRowTitle>{framework.name}</CardListRowTitle>
                        <Badge variant="outline">{framework.ladder.length} níveis</Badge>
                        <Badge variant="secondary">{framework.themes.length} competências</Badge>
                      </div>
                      <CardListRowMeta>
                        {framework.description || "Sem descrição ainda."}
                      </CardListRowMeta>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Layers className="size-4 text-muted-foreground" />
                      {canEditFrameworks ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(framework.id)}>
                            <Copy className="size-3.5" />
                            Duplicar
                          </Button>
                          <Link
                            href={`/gestao/pdi/frameworks/${framework.id}`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            Editar
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(framework.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Link
                          href={`/gestao/pdi/frameworks/${framework.id}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Ver detalhes
                        </Link>
                      )}
                    </div>
                  </CardListRow>
                ))}
              </CardListRows>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma trilha cadastrada ainda. Crie a primeira para aplicar PDIs.
              </div>
            )}
          </CardListBody>
        </CardList>
      </section>

      <section className="flex flex-col gap-3">
        <CardList>
          <CardListHeader
            title="PDIs ativos do time"
            description="Pessoas em acompanhamento com trilha, nível atual e prontidão consolidada."
            action={<Badge variant="outline">{activeAssignments.length}</Badge>}
          />
          <CardListBody className="divide-y divide-border/60">
            {activeAssignments.map((assignment) => {
              const user = getOrgUserById(assignment.userId)
              const framework = getFrameworkById(assignment.frameworkId)
              if (!framework) return null

              const currentLevels = Object.fromEntries(
                framework.themes.map((theme) => [
                  theme.id,
                  assignment.current[theme.id]?.level ?? 0,
                ])
              )
              const expected = getFrameworkExpectations(framework, assignment.currentLevelId)
              const readiness = computeFrameworkReadiness(
                currentLevels,
                expected,
                framework.themes.map((theme) => theme.id)
              )
              const levelName =
                framework.ladder.find((level) => level.id === assignment.currentLevelId)
                  ?.name ?? "—"

              return (
                <Link
                  key={assignment.id}
                  href={`/gestao/liderados/${assignment.userId}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <CardListRowTitle>{user?.name ?? "Colaborador"}</CardListRowTitle>
                    <CardListRowMeta>
                      {framework.name} · {levelName} · {assignment.cycleLabel}
                    </CardListRowMeta>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={readiness >= 80 ? "default" : "outline"}>
                      {readiness}% pronto
                    </Badge>
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
            {!activeAssignments.length ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhum PDI ativo no time. Aplique a partir da ficha de cada pessoa.
              </p>
            ) : null}
          </CardListBody>
        </CardList>
      </section>

      <Dialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir trilha?</DialogTitle>
            <DialogDescription>
              Trilhas em uso por PDI ativo não podem ser removidas. Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HubMetric({
  label,
  value,
  helper,
  suffix = "",
}: {
  label: string
  value: number
  helper: string
  suffix?: string
}) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card/65 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

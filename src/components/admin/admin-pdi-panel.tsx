"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { Check, X } from "lucide-react"

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
import { PersonAvatar } from "@/components/ui/person-avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  computeFrameworkReadiness,
  getFrameworkExpectations,
  type PdiPromotionRequest,
} from "@/lib/gestao/pdi/types"
import {
  approvePromotionRequest,
  getFrameworkById,
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  rejectPromotionRequest,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  getOrgUserById,
  subscribeOrgStore,
} from "@/lib/org/store"

type PdiTableFilter = "all" | "pending" | "active"

type PdiTableRow =
  | {
      id: string
      type: "pending"
      collaboratorName: string
      frameworkName: string
      levelLabel: string
      cycleLabel: string
      managerName: string
      readiness: number
      request: PdiPromotionRequest
      sortAt: string
    }
  | {
      id: string
      type: "active"
      collaboratorName: string
      frameworkName: string
      levelLabel: string
      cycleLabel: string
      managerName: string
      readiness: number
      userId: string
      sortAt: string
    }

export function AdminPdiPanel() {
  const { session } = useAuth()
  const pdiData = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const areaId = session?.areaId ?? null

  const areaUserIds = useMemo(() => {
    if (!areaId) return new Set<string>()
    return new Set(
      org.users.filter((user) => user.areaId === areaId).map((user) => user.id)
    )
  }, [areaId, org.users])

  const activeAssignments = useMemo(
    () =>
      pdiData.assignments.filter(
        (assignment) => assignment.status === "active" && areaUserIds.has(assignment.userId)
      ),
    [areaUserIds, pdiData.assignments]
  )

  const pending = useMemo(() => {
    if (!areaId) return []
    return pdiData.promotionRequests.filter(
      (request) => request.areaId === areaId && request.status === "pending"
    )
  }, [areaId, pdiData.promotionRequests])

  const resolved = useMemo(() => {
    if (!areaId) return []
    return pdiData.promotionRequests
      .filter((request) => request.areaId === areaId && request.status !== "pending")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 10)
  }, [areaId, pdiData.promotionRequests])

  const pdiRows = useMemo<PdiTableRow[]>(() => {
    const pendingRows: PdiTableRow[] = pending.map((request) => {
      const user = getOrgUserById(request.userId)
      const manager = getOrgUserById(request.managerId)
      const assignment = pdiData.assignments.find((entry) => entry.id === request.assignmentId)
      const framework = assignment ? getFrameworkById(assignment.frameworkId) : undefined
      const fromName = framework?.ladder.find((level) => level.id === request.fromLevelId)?.name ?? "—"
      const toName = framework?.ladder.find((level) => level.id === request.toLevelId)?.name ?? "—"

      return {
        id: request.id,
        type: "pending",
        collaboratorName: user?.name ?? "Colaborador",
        frameworkName: framework?.name ?? "Trilha",
        levelLabel: `${fromName} → ${toName}`,
        cycleLabel: assignment?.cycleLabel ?? "Ciclo não informado",
        managerName: manager?.name ?? "—",
        readiness: request.readiness,
        request,
        sortAt: request.updatedAt,
      }
    })

    const activeRows: PdiTableRow[] = activeAssignments.flatMap((assignment) => {
      const user = getOrgUserById(assignment.userId)
      const manager = getOrgUserById(assignment.managerId)
      const framework = getFrameworkById(assignment.frameworkId)
      if (!framework) return []

      const currentLevels = Object.fromEntries(
        framework.themes.map((theme) => [theme.id, assignment.current[theme.id]?.level ?? 0])
      )
      const expected = getFrameworkExpectations(framework, assignment.currentLevelId)
      const readiness = computeFrameworkReadiness(
        currentLevels,
        expected,
        framework.themes.map((theme) => theme.id)
      )
      const levelName =
        framework.ladder.find((level) => level.id === assignment.currentLevelId)?.name ?? "—"

      return [
        {
          id: assignment.id,
          type: "active",
          collaboratorName: user?.name ?? "Colaborador",
          frameworkName: framework.name,
          levelLabel: levelName,
          cycleLabel: assignment.cycleLabel,
          managerName: manager?.name ?? "—",
          readiness,
          userId: assignment.userId,
          sortAt: assignment.updatedAt,
        },
      ]
    })

    return [...pendingRows, ...activeRows].sort((a, b) => {
      if (a.type !== b.type) return a.type === "pending" ? -1 : 1
      return b.sortAt.localeCompare(a.sortAt)
    })
  }, [activeAssignments, pdiData.assignments, pending])

  const [filter, setFilter] = useState<PdiTableFilter>("all")
  const [reviewing, setReviewing] = useState<PdiPromotionRequest | null>(null)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const filteredRows = useMemo(() => {
    if (filter === "all") return pdiRows
    return pdiRows.filter((row) => row.type === filter)
  }, [filter, pdiRows])

  function openReview(request: PdiPromotionRequest, next: "approve" | "reject") {
    setReviewing(request)
    setAction(next)
    setAdminNotes("")
    setError(null)
  }

  function confirmReview() {
    if (!reviewing || !action || !session) return
    try {
      if (action === "approve") {
        approvePromotionRequest(reviewing.id, session.userId, adminNotes)
      } else {
        rejectPromotionRequest(reviewing.id, session.userId, adminNotes)
      }
      setReviewing(null)
      setAction(null)
      setAdminNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.")
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <PanelMetric label="Em análise" value={pending.length} />
          <PanelMetric label="Ativos" value={activeAssignments.length} />
          <PanelMetric label="Histórico recente" value={resolved.length} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              Todos
              <Badge variant={filter === "all" ? "secondary" : "outline"}>{pdiRows.length}</Badge>
            </Button>
            <Button
              size="sm"
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
            >
              Pendentes
              <Badge variant={filter === "pending" ? "secondary" : "outline"}>
                {pending.length}
              </Badge>
            </Button>
            <Button
              size="sm"
              variant={filter === "active" ? "default" : "outline"}
              onClick={() => setFilter("active")}
            >
              Ativos
              <Badge variant={filter === "active" ? "secondary" : "outline"}>
                {activeAssignments.length}
              </Badge>
            </Button>
          </div>
        </div>

        <CardList>
          <CardListHeader
            title="Fila e acompanhamento"
            description="Pendentes primeiro, depois PDIs ativos da área."
            action={<Badge variant="outline">{filteredRows.length} registros</Badge>}
          />
          <CardListBody>
            {filteredRows.length ? (
              <CardListRows>
                {filteredRows.map((row) => (
                  <CardListRow key={row.id}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <PersonAvatar
                        name={row.collaboratorName}
                        imageUrl={getOrgUserById(row.type === "pending" ? row.request.userId : row.userId)?.avatarUrl}
                      />
                      <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardListRowTitle>{row.collaboratorName}</CardListRowTitle>
                        <Badge variant={row.type === "pending" ? "secondary" : "outline"}>
                          {row.type === "pending" ? "Pendente" : "Ativo"}
                        </Badge>
                        <Badge variant={row.readiness >= 80 ? "default" : "outline"}>
                          {row.readiness}% pronto
                        </Badge>
                      </div>
                      <CardListRowMeta>
                        {row.frameworkName} · {row.levelLabel} · {row.cycleLabel}
                      </CardListRowMeta>
                      <CardListRowMeta>Gestor: {row.managerName}</CardListRowMeta>
                      {row.type === "pending" && row.request.managerNotes ? (
                        <p className="mt-3 rounded-[12px] border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          {row.request.managerNotes}
                        </p>
                      ) : null}
                    </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {row.type === "pending" ? (
                        <>
                          <Button size="sm" onClick={() => openReview(row.request, "approve")}>
                            <Check data-icon="inline-start" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReview(row.request, "reject")}
                          >
                            <X data-icon="inline-start" />
                            Reprovar
                          </Button>
                        </>
                      ) : (
                        <Link
                          href={`/gestao/liderados/${row.userId}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Abrir ficha
                        </Link>
                      )}
                    </div>
                  </CardListRow>
                ))}
              </CardListRows>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {filter === "pending"
                  ? "Nenhuma solicitação pendente."
                  : filter === "active"
                    ? "Nenhum PDI ativo na área."
                    : "Nenhum PDI encontrado para a área."}
              </p>
            )}
          </CardListBody>
        </CardList>
      </section>

      {/* Histórico de aprovações */}
      {resolved.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Histórico recente</h2>
          <CardList>
            <CardListHeader
              title="Histórico recente"
              description="Últimas decisões concluídas pela administração."
              action={<Badge variant="outline">{resolved.length}</Badge>}
            />
            <CardListBody className="divide-y">
              {resolved.map((request) => {
                const user = getOrgUserById(request.userId)
                const framework = getFrameworkById(
                  pdiData.assignments.find((entry) => entry.id === request.assignmentId)
                    ?.frameworkId ?? ""
                )
                const fromName =
                  framework?.ladder.find((level) => level.id === request.fromLevelId)?.name ??
                  "—"
                const toName =
                  framework?.ladder.find((level) => level.id === request.toLevelId)?.name ?? "—"

                return (
                  <CardListRow key={request.id} className="py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <PersonAvatar
                        name={user?.name ?? "Colaborador"}
                        imageUrl={user?.avatarUrl}
                      />
                      <div>
                        <CardListRowTitle>{user?.name ?? "Colaborador"}</CardListRowTitle>
                        <CardListRowMeta>
                          {framework?.name ? `${framework.name} · ` : ""}
                          {fromName} → {toName}
                          {request.adminNotes ? ` - ${request.adminNotes}` : ""}
                        </CardListRowMeta>
                      </div>
                    </div>
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "default"
                          : request.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {request.status === "approved"
                        ? "Aprovada"
                        : request.status === "rejected"
                          ? "Reprovada"
                          : "Cancelada"}
                    </Badge>
                  </CardListRow>
                )
              })}
            </CardListBody>
          </CardList>
        </section>
      ) : null}

      <Dialog
        open={Boolean(reviewing && action)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewing(null)
            setAction(null)
            setError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Aprovar subida no PDI" : "Reprovar solicitação"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "O nível na trilha do colaborador será atualizado após a aprovação."
                : "O gestor será informado via histórico da solicitação."}
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Observação (opcional)</span>
            <Textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={3}
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>
              Cancelar
            </Button>
            <Button
              variant={action === "reject" ? "destructive" : "default"}
              onClick={confirmReview}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PanelMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card/65 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  )
}

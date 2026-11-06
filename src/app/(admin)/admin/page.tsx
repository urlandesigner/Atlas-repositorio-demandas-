"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import { ArrowRight } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  CardList,
  CardListBody,
  CardListHeader,
} from "@/components/ui/card-list"
import { PageHeader } from "@/components/ui/page-header"
import { PersonAvatar } from "@/components/ui/person-avatar"
import { Progress } from "@/components/ui/progress"
import {
  AttentionColumn,
  AttentionRow,
  BrandSurface,
  BrandSurfaceHeading,
} from "@/components/ui/brand-surface"
import { Stat, StatStrip } from "@/components/ui/stat-strip"
import {
  getHrNoticesServerSnapshot,
  getHrNoticesSnapshot,
  subscribeHrNoticesStore,
} from "@/lib/hr/store"
import {
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import { getAreaPermissions } from "@/lib/gestao/permissions/store"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"

export default function AdminHomePage() {
  const { session } = useAuth()
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const pdiData = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )
  const hrNotices = useSyncExternalStore(
    subscribeHrNoticesStore,
    getHrNoticesSnapshot,
    getHrNoticesServerSnapshot
  )

  const areaId = session?.areaId ?? null

  const managers = useMemo(() => {
    if (!areaId) return []
    return org.users.filter((user) => user.areaId === areaId && user.role === "gestor")
  }, [areaId, org.users])

  const collaborators = useMemo(() => {
    if (!areaId) return []
    return org.users.filter((user) => user.areaId === areaId && user.role === "colaborador")
  }, [areaId, org.users])

  const areaUserIds = useMemo(() => {
    if (!areaId) return new Set<string>()
    return new Set(org.users.filter((user) => user.areaId === areaId).map((user) => user.id))
  }, [areaId, org.users])

  const activeAssignments = useMemo(
    () =>
      pdiData.assignments.filter(
        (assignment) => assignment.status === "active" && areaUserIds.has(assignment.userId)
      ),
    [areaUserIds, pdiData.assignments]
  )

  const activePdis = activeAssignments.length

  const pendingRequests = useMemo(
    () =>
      pdiData.promotionRequests.filter(
        (request) => request.areaId === areaId && request.status === "pending"
      ),
    [areaId, pdiData.promotionRequests]
  )

  const frameworksCount = useMemo(
    () =>
      pdiData.frameworks.filter((framework) => framework.areaId === areaId || framework.areaId === null)
        .length,
    [areaId, pdiData.frameworks]
  )

  const coverage = collaborators.length ? Math.round((activePdis / collaborators.length) * 100) : 0
  const hrNoticesCount = useMemo(
    () => hrNotices.filter((notice) => notice.areaId === areaId).length,
    [areaId, hrNotices]
  )

  const managersWithReports = useMemo(() => {
    const directReportCount = new Map<string, number>()
    org.users.forEach((user) => {
      if (user.managerId) {
        directReportCount.set(user.managerId, (directReportCount.get(user.managerId) ?? 0) + 1)
      }
    })

    return managers
      .map((manager) => ({
        id: manager.id,
        name: manager.name,
        avatarUrl: manager.avatarUrl,
        title: manager.managementTitle ?? "Gestor",
        reports: directReportCount.get(manager.id) ?? 0,
      }))
      .sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name))
  }, [managers, org.users])

  const collaboratorsWithoutPdi = useMemo(() => {
    const activeUserIds = new Set(activeAssignments.map((assignment) => assignment.userId))
    return collaborators
      .filter((user) => !activeUserIds.has(user.id))
      .map((user) => {
        const manager = managers.find((entry) => entry.id === user.managerId)
        return {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          managerName: manager?.name ?? "Sem gestor",
        }
      })
      .slice(0, 5)
  }, [activeAssignments, collaborators, managers])

  const permissions = useMemo(
    () => (areaId ? getAreaPermissions(areaId) : null),
    [areaId]
  )

  const leadersWithReports = managersWithReports.filter((item) => item.reports > 0).length
  const pendingCount = pendingRequests.length
  const uncoveredCount = collaborators.length - activePdis
  const decisionSummary = [
    pendingCount ? `${pendingCount} ${pendingCount === 1 ? "aprovação aguardando" : "aprovações aguardando"}` : null,
    uncoveredCount > 0
      ? `${uncoveredCount} ${uncoveredCount === 1 ? "pessoa sem PDI" : "pessoas sem PDI"}`
      : null,
  ].filter((part): part is string => Boolean(part))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visão geral"
        description="O que pede sua decisão, como a área está e o que os colaboradores enxergam."
      />

      {/* Destaque de marca, a mesma superfície do Início do colaborador e da
          Visão geral do gestor: o primeiro bloco é o que só o admin pode
          destravar. Antes a fila vinha na terceira fileira, depois de cinco
          números e de um painel de atalhos. */}
      <BrandSurface labelledBy="admin-decision-title">
        <BrandSurfaceHeading
          id="admin-decision-title"
          label="Pede sua decisão"
          parts={decisionSummary}
          empty="Nada pendente na área"
        />

        <div className="grid gap-6 p-6 lg:grid-cols-2 lg:gap-8 lg:p-8">
          <AttentionColumn
            title="Aprovações de subida"
            count={pendingCount}
            footerHref="/admin/pdis"
            footerLabel="Abrir PDIs"
            emptyText="Nenhuma aprovação pendente."
          >
            {pendingRequests.slice(0, 4).map((request) => {
              const assignment = pdiData.assignments.find((entry) => entry.id === request.assignmentId)
              const framework = assignment
                ? pdiData.frameworks.find((entry) => entry.id === assignment.frameworkId)
                : undefined
              const collaborator = collaborators.find((user) => user.id === request.userId)
              const fromName =
                framework?.ladder.find((level) => level.id === request.fromLevelId)?.name ?? "—"
              const toName =
                framework?.ladder.find((level) => level.id === request.toLevelId)?.name ?? "—"

              return (
                <AttentionRow
                  key={request.id}
                  href="/admin/pdis"
                  name={collaborator?.name ?? "Colaborador"}
                  avatarUrl={collaborator?.avatarUrl}
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
            title="Sem PDI ativo"
            count={uncoveredCount}
            footerHref="/admin/colaboradores"
            footerLabel="Ver colaboradores"
            emptyText="Toda a base já está com PDI ativo."
          >
            {collaboratorsWithoutPdi.slice(0, 4).map((item) => (
              <AttentionRow
                key={item.id}
                href="/admin/colaboradores"
                name={item.name}
                avatarUrl={item.avatarUrl}
                meta={`Gestor: ${item.managerName}`}
              />
            ))}
          </AttentionColumn>
        </div>
      </BrandSurface>

      {/* Cada número leva à página dele, o que torna redundante o antigo painel
          "Acesso rápido", que repetia o menu lateral item por item. */}
      <StatStrip aria-label="Números da área">
        <Stat href="/admin/colaboradores" label="Colaboradores" value={collaborators.length} helper="Vinculados à área" />
        <Stat href="/admin/gestores" label="Gestores" value={managers.length} helper="Quem opera a área" />
        <Stat href="/admin/pdis" label="PDIs ativos" value={activePdis} helper={`${coverage}% da base`} />
        <Stat
          href="/admin/pdis"
          label="Aprovações"
          value={pendingCount}
          helper={pendingCount ? "Aguardando decisão" : "Fila vazia"}
        />
        <Stat href="/admin/avisos-rh" label="Avisos RH" value={hrNoticesCount} helper="Publicados na área" />
      </StatStrip>

      {/* Colunas de jornal, como no Início: a altura dos três painéis depende
          do dado (um gestor ou dez), e em grade a fileira ficava com o buraco
          do painel mais baixo. */}
      <div className="columns-1 gap-4 *:mb-4 *:break-inside-avoid xl:columns-2 -mb-4">
        <CardList>
          <CardListHeader title="Indicadores da área" />
          <CardListBody className="divide-y divide-border/60 px-6 pb-2">
            <HealthRow
              label="Cobertura de PDI"
              value={`${coverage}%`}
              description={`${activePdis} de ${collaborators.length || 0} colaboradores com PDI ativo`}
              progress={coverage}
            />
            <HealthRow
              label="Estrutura de liderança"
              value={`${leadersWithReports}/${managers.length || 0}`}
              description="Gestores com pessoas atribuídas"
              progress={managers.length ? Math.round((leadersWithReports / managers.length) * 100) : 0}
            />
            <HealthRow
              label="Trilhas disponíveis"
              value={`${frameworksCount}`}
              description="Trilhas globais e da área"
              progress={Math.min(100, frameworksCount * 20)}
            />
          </CardListBody>
        </CardList>

        <CardList>
          <CardListHeader
            title="Visibilidade da área"
            description="O que os colaboradores enxergam hoje no próprio perfil."
            action={
              <Link href="/admin/permissoes" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ajustar
                <ArrowRight data-icon="inline-end" />
              </Link>
            }
          />
          <CardListBody className="divide-y divide-border/60 px-6 pb-2">
            <PermissionRow
              label="Perfil comportamental"
              enabled={permissions?.collaboratorCanViewDisc ?? false}
            />
            <PermissionRow
              label="Competências"
              enabled={permissions?.collaboratorCanViewSoftSkills ?? false}
            />
            <PermissionRow
              label="Orientações de liderança"
              enabled={permissions?.collaboratorCanViewHowToLead ?? false}
            />
          </CardListBody>
        </CardList>

        <CardList>
          <CardListHeader
            title="Gestores da área"
            action={
              <Link href="/admin/gestores" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ver gestão
                <ArrowRight data-icon="inline-end" />
              </Link>
            }
          />
          <CardListBody className="divide-y divide-border/60 px-6 pb-2">
            {managersWithReports.length ? (
              managersWithReports.map((manager) => (
                <div key={manager.id} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <PersonAvatar name={manager.name} imageUrl={manager.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{manager.name}</p>
                      <p className="text-xs text-muted-foreground">{manager.title}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {manager.reports} {manager.reports === 1 ? "liderado" : "liderados"}
                  </Badge>
                </div>
              ))
            ) : (
              <EmptyMiniState text="Nenhum gestor cadastrado para esta área." />
            )}
          </CardListBody>
        </CardList>
      </div>
    </div>
  )
}

function HealthRow({
  label,
  value,
  description,
  progress,
}: {
  label: string
  value: string
  description: string
  progress: number
}) {
  return (
    <div className="space-y-2 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-sm font-semibold">{value}</span>
      </div>
      <Progress value={Math.max(0, Math.min(100, progress))} size="md" tone="primary" />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function PermissionRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <span className="text-sm">{label}</span>
      <Badge variant={enabled ? "default" : "outline"}>{enabled ? "Ativo" : "Oculto"}</Badge>
    </div>
  )
}

function EmptyMiniState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-background/35 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useSyncExternalStore } from "react"
import {
  CheckSquare,
  Megaphone,
  ShieldCheck,
  Target,
  UserCog,
  Users,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  CardList,
  CardListBody,
  CardListHeader,
} from "@/components/ui/card-list"
import { MetricCard } from "@/components/ui/metric-card"
import { PageHeader } from "@/components/ui/page-header"
import { PersonAvatar } from "@/components/ui/person-avatar"
import { Progress } from "@/components/ui/progress"
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
  const pathname = usePathname()
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

  const adminShortcuts = useMemo(
    () =>
      [
        { href: "/admin/pdis", label: "Revisar PDIs" },
        { href: "/admin/colaboradores", label: "Colaboradores" },
        { href: "/admin/gestores", label: "Gestores" },
        { href: "/admin/avisos-rh", label: "Avisos RH" },
        { href: "/admin/permissoes", label: "Permissões" },
        { href: "/admin/auditoria", label: "Auditoria" },
      ].filter((item) => item.href !== pathname),
    [pathname]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visão geral"
        description={
          pendingRequests.length > 0
            ? `${pendingRequests.length} ${
                pendingRequests.length === 1 ? "aprovação aguardando" : "aprovações aguardando"
              }`
            : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard variant="card" icon={UserCog} label="Gestores" value={managers.length} helper="Quem opera a área" />
        <MetricCard variant="card" icon={Users} label="Colaboradores" value={collaborators.length} helper="Vinculados à área" />
        <MetricCard variant="card" icon={Target} label="PDIs ativos" value={activePdis} helper={`${coverage}% da base acompanhada`} />
        <MetricCard
          variant="card"
          icon={CheckSquare}
          label="Aprovações pendentes"
          value={pendingRequests.length}
          helper={pendingRequests.length ? "Subidas aguardando decisão" : "Sem fila de aprovação"}
        />
        <MetricCard variant="card" icon={Megaphone} label="Avisos RH" value={hrNoticesCount} helper="Publicados na home da área" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <CardList className="border-border/60">
          <CardListHeader title="Indicadores da área" />
          <CardListBody className="space-y-4 p-4">
            <HealthRow
              label="Cobertura de PDI"
              value={`${coverage}%`}
              description={`${activePdis} de ${collaborators.length || 0} colaboradores com PDI ativo`}
              progress={coverage}
            />
            <HealthRow
              label="Estrutura de liderança"
              value={`${managersWithReports.filter((item) => item.reports > 0).length}/${managers.length || 0}`}
              description="Gestores com pessoas atribuídas"
              progress={
                managers.length
                  ? Math.round(
                      (managersWithReports.filter((item) => item.reports > 0).length / managers.length) * 100
                    )
                  : 0
              }
            />
            <HealthRow
              label="Trilhas disponíveis"
              value={`${frameworksCount}`}
              description="Trilhas globais e da área disponíveis"
              progress={Math.min(100, frameworksCount * 20)}
            />
          </CardListBody>
        </CardList>

        <CardList className="border-border/60">
          <CardListHeader
            title="Acesso rápido"
            action={<ShieldCheck className="size-4 text-muted-foreground" />}
          />
          <CardListBody className="flex flex-wrap gap-2 p-4">
            {adminShortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {item.label}
              </Link>
            ))}
          </CardListBody>
        </CardList>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CardList className="border-border/60 xl:col-span-2">
          <CardListHeader
            title="Fila de decisão"
            description="Solicitações que dependem de resposta do admin de área."
            action={
              <Link href="/admin/pdis" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Abrir PDIs
              </Link>
            }
          />
          <CardListBody className="space-y-2 p-4">
            {pendingRequests.length ? (
              pendingRequests.slice(0, 5).map((request) => {
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
                  <div
                    key={request.id}
                    className="flex flex-col gap-2 rounded-[12px] border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <PersonAvatar
                          name={collaborator?.name ?? "Colaborador"}
                          imageUrl={collaborator?.avatarUrl}
                        />
                        <p className="text-sm font-medium">{collaborator?.name ?? "Colaborador"}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {framework?.name ?? "Trilha"} · {fromName} → {toName}
                      </p>
                    </div>
                    <Badge variant={request.readiness >= 80 ? "default" : "outline"}>
                      {request.readiness}% pronto
                    </Badge>
                  </div>
                )
              })
            ) : (
              <EmptyMiniState text="Nenhuma aprovação pendente no momento." />
            )}
          </CardListBody>
        </CardList>

        <CardList className="border-border/60">
          <CardListHeader
            title="Cobertura imediata"
            description="Colaboradores que ainda não estão cobertos por um PDI ativo."
          />
          <CardListBody className="space-y-2 p-4">
            {collaboratorsWithoutPdi.length ? (
              collaboratorsWithoutPdi.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[12px] border border-border/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={item.name} imageUrl={item.avatarUrl} />
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Gestor: {item.managerName}</p>
                </div>
              ))
            ) : (
              <EmptyMiniState text="Toda a base já está com PDI ativo." />
            )}
          </CardListBody>
        </CardList>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
        <CardList className="border-border/60">
          <CardListHeader
            title="Gestores da área"
            action={
              <Link href="/admin/gestores" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Ver gestão
              </Link>
            }
          />
          <CardListBody className="space-y-2 p-4">
            {managersWithReports.length ? (
              managersWithReports.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center justify-between rounded-[12px] border border-border/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={manager.name} imageUrl={manager.avatarUrl} />
                    <div>
                      <p className="text-sm font-medium">{manager.name}</p>
                      <p className="text-xs text-muted-foreground">{manager.title}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{manager.reports} liderado(s)</Badge>
                </div>
              ))
            ) : (
              <EmptyMiniState text="Nenhum gestor cadastrado para esta área." />
            )}
          </CardListBody>
        </CardList>

        <CardList className="border-border/60">
          <CardListHeader
            title="Visibilidade da área"
            description="O que os colaboradores podem enxergar hoje no próprio perfil."
          />
          <CardListBody className="space-y-2 p-4">
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
            <div className="pt-2">
              <Link href="/admin/permissoes" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ajustar permissões
              </Link>
            </div>
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
    <div className="space-y-2 rounded-[12px] border border-border/60 bg-background/35 px-4 py-4">
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
    <div className="flex items-center justify-between rounded-[12px] border border-border/60 bg-background/35 px-4 py-3">
      <span className="text-sm">{label}</span>
      <Badge variant={enabled ? "default" : "outline"}>{enabled ? "Ativo" : "Oculto"}</Badge>
    </div>
  )
}

function EmptyMiniState({ text }: { text: string }) {
  return (
    <div className="rounded-[12px] border border-dashed border-border/60 bg-background/35 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}

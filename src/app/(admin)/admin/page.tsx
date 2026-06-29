"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useSyncExternalStore } from "react"
import {
  CheckSquare,
  ShieldCheck,
  Target,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  const areaId = session?.areaId ?? null

  const area = useMemo(() => {
    if (!areaId) return null
    return org.areas.find((entry) => entry.id === areaId) ?? null
  }, [areaId, org.areas])

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
        { href: "/admin/permissoes", label: "Permissões" },
        { href: "/admin/auditoria", label: "Auditoria" },
      ].filter((item) => item.href !== pathname),
    [pathname]
  )

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[18px] border border-border/55 bg-card px-6 py-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Administração
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {area ? `${area.name} em foco` : "Visão geral da área"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Acompanhe a cobertura de PDI, a capacidade da liderança e o que precisa de decisão
              agora na sua área.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{managers.length} gestor(es)</Badge>
            <Badge variant="outline">{collaborators.length} colaborador(es)</Badge>
            <Badge variant={pendingRequests.length ? "secondary" : "outline"}>
              {pendingRequests.length} pendência(s)
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UserCog} label="Gestores" value={managers.length} hint="Responsáveis pela operação da área" />
        <Metric icon={Users} label="Colaboradores" value={collaborators.length} hint="Profissionais vinculados à área" />
        <Metric icon={Target} label="PDIs ativos" value={activePdis} hint={`${coverage}% da base acompanhada`} />
        <Metric
          icon={CheckSquare}
          label="Aprovações pendentes"
          value={pendingRequests.length}
          hint={pendingRequests.length ? "Subidas aguardando decisão" : "Sem fila de aprovação"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saúde da operação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <HealthRow
              label="Cobertura de PDI"
              value={`${coverage}%`}
              description={`${activePdis} de ${collaborators.length || 0} colaboradores com PDI ativo`}
              progress={coverage}
            />
            <HealthRow
              label="Estrutura de liderança"
              value={`${managersWithReports.filter((item) => item.reports > 0).length}/${managers.length || 0}`}
              description="Gestores com time efetivamente atribuído"
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
              description="Trilhas globais e da área prontas para uso"
              progress={Math.min(100, frameworksCount * 20)}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Atalhos do admin</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {adminShortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border-border/60 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Fila de decisão</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Solicitações que dependem de resposta do admin de área.
              </p>
            </div>
            <Link href="/admin/pdis" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Abrir PDIs
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
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
                      <p className="text-sm font-medium">{collaborator?.name ?? "Colaborador"}</p>
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
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cobertura imediata</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Colaboradores que ainda não estão cobertos por um PDI ativo.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {collaboratorsWithoutPdi.length ? (
              collaboratorsWithoutPdi.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[12px] border border-border/60 px-4 py-3"
                >
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Gestor: {item.managerName}</p>
                </div>
              ))
            ) : (
              <EmptyMiniState text="Toda a base já está com PDI ativo." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Gestores da área</CardTitle>
            <Link href="/admin/gestores" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ver gestão
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {managersWithReports.length ? (
              managersWithReports.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center justify-between rounded-[12px] border border-border/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{manager.name}</p>
                    <p className="text-xs text-muted-foreground">{manager.title}</p>
                  </div>
                  <Badge variant="outline">{manager.reports} liderado(s)</Badge>
                </div>
              ))
            ) : (
              <EmptyMiniState text="Nenhum gestor cadastrado para esta área." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Visibilidade da área</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              O que os colaboradores podem enxergar hoje no próprio perfil.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: number
  hint?: string
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
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
      <div className="h-2 overflow-hidden rounded-full bg-muted/70">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
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

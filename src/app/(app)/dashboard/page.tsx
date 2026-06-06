"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Presentation,
  Target,
  Zap,
} from "lucide-react"

import { useRecords } from "@/components/shell/records-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  getObjectivesServerSnapshot,
  getObjectivesSnapshot,
  OBJECTIVE_STATUS_LABEL,
  PDI_DIMENSION_LABEL,
  subscribeObjectivesStore,
  type ObjectiveEntry,
} from "@/lib/objectives/store"
import {
  getPresentationsServerSnapshot,
  getPresentationsSnapshot,
  subscribePresentationsStore,
} from "@/lib/presentations/store"
import {
  getProjectsServerSnapshot,
  getProjectsSnapshot,
  subscribeProjectsStore,
  TAB_LABEL,
  type ProjectEntry,
  type WorkspaceTab,
} from "@/lib/projects/store"
import type { RecordEntry } from "@/lib/records/types"
import { cn } from "@/lib/utils"

type ActivityItem = {
  id: string
  title: string
  description: string
  href: string
  date: string
  icon: React.ElementType
  label: string
}

const STATUS_CLASS: Record<ObjectiveEntry["status"], string> = {
  planned: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  done: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paused: "border-muted-foreground/20 bg-muted text-muted-foreground",
}

function isSameMonth(value: string, reference = new Date()) {
  const date = new Date(value)
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear()
}

function formatDate(value: string | null) {
  if (!value) return "Sem data"
  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  const normalized = datePart ? `${datePart}T00:00:00` : value
  return new Date(normalized).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

function getDaysUntil(deadline: string | null) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${deadline}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function flattenProjects(projects: Record<WorkspaceTab, ProjectEntry[]>) {
  return (Object.keys(projects) as WorkspaceTab[]).flatMap((workspace) =>
    projects[workspace].map((project) => ({ ...project, workspace }))
  )
}

function getProjectPath(project: ProjectEntry & { workspace: WorkspaceTab }) {
  return `/projects/${project.workspace}/${project.id}`
}

function getRecordActivity(record: RecordEntry): ActivityItem {
  return {
    id: `record-${record.id}`,
    title: record.enriched.title,
    description: record.enriched.impact || record.enriched.contribution || record.raw,
    href: "/professional/timeline",
    date: record.updatedAt || record.createdAt,
    icon: Zap,
    label: "Registro",
  }
}

function getObjectiveActivity(objective: ObjectiveEntry): ActivityItem {
  return {
    id: `objective-${objective.id}`,
    title: objective.title,
    description: objective.motivation ?? "Objetivo profissional registrado.",
    href: "/professional/objectives",
    date: objective.updated_at || objective.created_at,
    icon: Target,
    label: "Objetivo",
  }
}

function MetricCard({
  label,
  value,
  description,
  href,
  icon: Icon,
}: {
  label: string
  value: number | string
  description: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <Link href={href} className="block h-full">
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Link>
    </Card>
  )
}

function EmptyPanel({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/15 px-4 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  )
}

function ObjectiveRow({ objective }: { objective: ObjectiveEntry }) {
  const daysUntil = getDaysUntil(objective.deadline)
  const dimension = objective.dimensions[0]

  return (
    <Link
      href="/professional/objectives"
      className="flex items-start justify-between gap-4 rounded-lg border bg-background px-3 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-medium">{objective.title}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn("font-normal", STATUS_CLASS[objective.status])}>
            {OBJECTIVE_STATUS_LABEL[objective.status]}
          </Badge>
          {dimension ? (
            <Badge variant="outline" className="font-normal">
              {PDI_DIMENSION_LABEL[dimension]}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">
        <CalendarDays className="ml-auto size-3.5" />
        <span className="mt-1 block">
          {daysUntil === null
            ? "Sem prazo"
            : daysUntil < 0
              ? `${Math.abs(daysUntil)}d atraso`
              : `${daysUntil}d`}
        </span>
      </div>
    </Link>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/45"
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <item.icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
          <Badge variant="outline" className="h-5 shrink-0 font-normal">
            {item.label}
          </Badge>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</span>
    </Link>
  )
}

function ProjectWorkspaceRow({
  workspace,
  projects,
}: {
  workspace: WorkspaceTab
  projects: ProjectEntry[]
}) {
  const active = projects.filter((project) => project.status === "active").length

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-3">
      <div>
        <p className="text-sm font-medium">{TAB_LABEL[workspace]}</p>
        <p className="text-xs text-muted-foreground">{projects.length} projeto(s)</p>
      </div>
      <Badge variant="outline" className="font-normal">
        {active} ativo(s)
      </Badge>
    </div>
  )
}

export default function DashboardPage() {
  const { records, openCapture } = useRecords()
  const projects = useSyncExternalStore(
    subscribeProjectsStore,
    getProjectsSnapshot,
    getProjectsServerSnapshot
  )
  const objectives = useSyncExternalStore(
    subscribeObjectivesStore,
    getObjectivesSnapshot,
    getObjectivesServerSnapshot
  )
  const presentations = useSyncExternalStore(
    subscribePresentationsStore,
    getPresentationsSnapshot,
    getPresentationsServerSnapshot
  )

  const flatProjects = useMemo(() => flattenProjects(projects), [projects])
  const activeProjects = flatProjects.filter((project) => project.status === "active")
  const recordsThisMonth = records.filter((record) => isSameMonth(record.createdAt))
  const activeObjectives = objectives.filter((objective) =>
    objective.status === "planned" || objective.status === "in_progress"
  )
  const completedPresentations = presentations.filter((item) => item.status === "done")
  const scheduledPresentations = presentations.filter((item) => item.status === "scheduled")

  const nextObjectives = useMemo(() => {
    return [...activeObjectives]
      .sort((a, b) => {
        const aDays = getDaysUntil(a.deadline) ?? Number.POSITIVE_INFINITY
        const bDays = getDaysUntil(b.deadline) ?? Number.POSITIVE_INFINITY
        return aDays - bDays
      })
      .slice(0, 4)
  }, [activeObjectives])

  const recentRecords = useMemo(
    () => [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4),
    [records]
  )

  const recentActivity = useMemo(() => {
    const recordActivity = records.slice(0, 4).map(getRecordActivity)
    const objectiveActivity = objectives.slice(0, 4).map(getObjectiveActivity)
    return [...recordActivity, ...objectiveActivity]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6)
  }, [objectives, records])

  const latestProjects = useMemo(
    () => [...flatProjects].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")).slice(0, 4),
    [flatProjects]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O que está em andamento, o que virou evidência e onde vale focar agora.
          </p>
        </div>

        <Button size="sm" onClick={openCapture}>
          <Zap data-icon="inline-start" />
          Novo registro
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Registros este mês"
          value={recordsThisMonth.length}
          icon={Zap}
          href="/professional/timeline"
          description={`${records.length} registro(s) no histórico`}
        />
        <MetricCard
          label="Objetivos ativos"
          value={activeObjectives.length}
          icon={Target}
          href="/professional/objectives"
          description={`${objectives.filter((item) => item.status === "done").length} concluído(s)`}
        />
        <MetricCard
          label="Projetos ativos"
          value={activeProjects.length}
          icon={FolderOpen}
          href="/projects"
          description={`${flatProjects.length} projeto(s) cadastrados`}
        />
        <MetricCard
          label="Apresentações"
          value={presentations.length}
          icon={Presentation}
          href="/professional/presentations"
          description={`${completedPresentations.length} realizada(s)`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Atividade recente</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Registros e objetivos atualizados por último.
              </p>
            </div>
            <Link
              href="/professional/timeline"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Timeline
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length ? (
              <div className="flex flex-col gap-1">
                {recentActivity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                icon={Zap}
                title="Nenhuma atividade registrada ainda. Comece documentando uma atuação ou criando um objetivo."
                action={
                  <Button size="sm" onClick={openCapture}>
                    <Zap data-icon="inline-start" />
                    Criar registro
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Foco do ciclo</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Objetivos ativos ordenados por prazo.
              </p>
            </div>
            <Link
              href="/professional/objectives"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Objetivos
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </CardHeader>
          <CardContent>
            {nextObjectives.length ? (
              <div className="flex flex-col gap-2">
                {nextObjectives.map((objective) => (
                  <ObjectiveRow key={objective.id} objective={objective} />
                ))}
              </div>
            ) : (
              <EmptyPanel
                icon={Target}
                title="Nenhum objetivo ativo. Defina o que você quer construir no próximo ciclo."
                action={
                  <Link
                    href="/professional/objectives"
                    className={buttonVariants({ size: "sm" })}
                  >
                    <Target data-icon="inline-start" />
                    Criar objetivo
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Projetos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Visão geral dos projetos profissionais.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ProjectWorkspaceRow workspace="professional" projects={projects.professional} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Projetos recentes</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Últimos projetos atualizados.
              </p>
            </div>
            <FolderOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestProjects.length ? (
              <div className="flex flex-col gap-1">
                {latestProjects.map((project) => (
                  <Link
                    key={`${project.workspace}-${project.id}`}
                    href={getProjectPath(project)}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/45"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{TAB_LABEL[project.workspace]}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 font-normal">
                      {project.status === "active" ? "Ativo" : "Não ativo"}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyPanel icon={FolderOpen} title="Nenhum projeto encontrado." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Conhecimento compartilhado</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Apresentações registradas no ciclo.
              </p>
            </div>
            <Presentation className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background px-3 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5" />
                  Realizadas
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {completedPresentations.length}
                </p>
              </div>
              <div className="rounded-lg border bg-background px-3 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="size-3.5" />
                  Agendadas
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {scheduledPresentations.length}
                </p>
              </div>
            </div>

            <Separator />

            {presentations.length ? (
              <div className="flex flex-col gap-1">
                {presentations.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/professional/presentations"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/45"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sharedWith || formatDate(item.date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma apresentação registrada ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {recentRecords.length ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Últimos registros de impacto</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Evidências que alimentam timeline, objetivos e PDI.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={openCapture}>
              Novo registro
              <Zap data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href="/professional/timeline"
                  className="rounded-lg border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-medium">{record.enriched.title}</p>
                    <Badge variant="outline" className="shrink-0 font-normal">
                      {record.impactLevel}/5
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {record.enriched.impact || record.enriched.contribution || record.raw}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

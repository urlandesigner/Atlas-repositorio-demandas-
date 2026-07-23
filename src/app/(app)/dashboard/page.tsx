"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Presentation,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { HrNoticesPanel } from "@/components/hr/hr-notices-panel"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
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
import { getRecordImpactText } from "@/lib/records/display"
import { cn } from "@/lib/utils"

type ActivityItem = {
  id: string
  title: string
  description: string
  href: string
  date: string
  icon: LucideIcon
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
    description: getRecordImpactText(record) || record.raw,
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
    description: objective.motivation ?? objective.title,
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
  icon: LucideIcon
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
  icon: LucideIcon
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-border/60 bg-muted/15 px-4 py-10 text-center">
      <div className="icon-well flex size-10 items-center justify-center rounded-full">
        <Icon className="size-5" />
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
      className="flex items-start justify-between gap-4 rounded-[12px] border border-border/60 bg-card/[0.98] px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_14px_28px_rgba(15,23,42,0.075)]"
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
      <div className="icon-well mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
        <item.icon className="size-4" />
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

function WorkFlowGuide({
  projectCount,
  objectiveCount,
  recordCount,
  onRecord,
}: {
  projectCount: number
  objectiveCount: number
  recordCount: number
  onRecord: () => void
}) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-border bg-card">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Seu fluxo no Atlas
          </p>
          <h2 className="mt-1 text-lg font-medium tracking-tight">Do trabalho à evidência</h2>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-right">
          Escolha onde está atuando, registre o que avançou e acompanhe tudo em um só histórico.
        </p>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_auto_1.12fr_auto_1fr]">
        <div className="group px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold text-muted-foreground">
              1
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Escolha o contexto</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Organize seu trabalho antes de registrar o avanço.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/projects"
                  className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {projectCount} projeto(s)
                </Link>
                <Link
                  href="/professional/objectives"
                  className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {objectiveCount} objetivo(s)
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden items-center text-border md:flex">
          <ArrowRight className="size-4" />
        </div>

        <button
          type="button"
          onClick={onRecord}
          className="group relative m-2 overflow-hidden rounded-[10px] bg-primary px-5 py-4 text-left text-primary-foreground transition-colors hover:bg-primary/92 md:m-3"
        >
          <div className="absolute -right-6 -top-8 size-28 rounded-full border border-white/15" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xs font-semibold">
              2
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Registre o progresso</p>
                <Zap className="size-4 transition-transform group-hover:scale-110" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-primary-foreground/75">
                Conte o que entregou. Projeto e objetivo podem ser vinculados na mesma ação.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium">
                Criar registro
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </button>

        <div className="hidden items-center text-border md:flex">
          <ArrowRight className="size-4" />
        </div>

        <Link href="/professional/timeline" className="group px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold text-muted-foreground">
              3
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                Acompanhe os registros
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {recordCount === 1
                  ? "1 evidência já faz parte do seu histórico."
                  : `${recordCount} evidências já fazem parte do seu histórico.`}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}

function CareerLoopCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="icon-well flex size-10 shrink-0 items-center justify-center rounded-full">
            <TrendingUp className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Loop de carreira
            </p>
            <h2 className="mt-1 text-sm font-medium tracking-tight">
              Seus registros viram evidência para o próximo nível
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              O que você documenta no dia a dia vira evidência das suas competências e alimenta o
              dossiê de promoção. Veja como sua evolução vem tomando forma.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/professional/evolution/radar"
            className={buttonVariants({ size: "sm" })}
          >
            <TrendingUp data-icon="inline-start" />
            Ver evolução
          </Link>
          <Link
            href="/professional/evolution/promotion"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Montar dossiê
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}


export default function DashboardPage() {
  const { session } = useAuth()
  const { records, openCapture } = useRecords()
  const displayName = session?.name?.trim()
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

  const recentActivity = useMemo(() => {
    const recordActivity = records.slice(0, 4).map(getRecordActivity)
    const objectiveActivity = objectives.slice(0, 4).map(getObjectiveActivity)
    return [...recordActivity, ...objectiveActivity]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
  }, [objectives, records])

  const latestProjects = useMemo(
    () => [...flatProjects].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")).slice(0, 4),
    [flatProjects]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {session?.role === "gestor"
              ? "Visão geral"
              : displayName
                ? `Olá, ${displayName}`
                : "Olá"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O que está em andamento, o que virou evidência e onde vale focar agora.
          </p>
        </div>

        <PageHeaderActions>
          <Button size="sm" onClick={() => openCapture()}>
            <Zap data-icon="inline-start" />
            Registrar progresso
          </Button>
        </PageHeaderActions>
      </div>

      <WorkFlowGuide
        projectCount={activeProjects.length}
        objectiveCount={activeObjectives.length}
        recordCount={records.length}
        onRecord={() => openCapture()}
      />

      <CareerLoopCard />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Registros este mês"
          value={recordsThisMonth.length}
          icon={Zap}
          href="/professional/timeline"
          description={`${records.length} no histórico`}
        />
        <MetricCard
          label="Objetivos ativos"
          value={activeObjectives.length}
          icon={Target}
          href="/professional/objectives"
          description={`${objectives.filter((item) => item.status === "done").length} concluídos`}
        />
        <MetricCard
          label="Projetos ativos"
          value={activeProjects.length}
          icon={FolderOpen}
          href="/projects"
          description={`${flatProjects.length} cadastrados`}
        />
        <MetricCard
          label="Apresentações"
          value={presentations.length}
          icon={Presentation}
          href="/professional/presentations"
          description={`${completedPresentations.length} realizadas`}
        />
      </div>

      <HrNoticesPanel />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Últimas movimentações</CardTitle>
            </div>
            <Link
              href="/professional/timeline"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver registros
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
                title="Ainda sem registros nem objetivos. Documente uma entrega ou defina uma meta para o ciclo."
                action={
                  <Button size="sm" onClick={() => openCapture()}>
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
                title="Nenhum objetivo ativo. Escolha o que quer avançar neste ciclo."
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Projetos recentes</CardTitle>
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
              <EmptyPanel icon={FolderOpen} title="Nenhum projeto cadastrado." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-medium">Apresentações</CardTitle>
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

    </div>
  )
}

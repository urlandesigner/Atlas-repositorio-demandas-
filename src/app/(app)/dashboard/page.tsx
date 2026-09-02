"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import {
  ArrowRight,
  ArrowUpRight,
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
import { Trilha } from "@/components/career/trilha"
import { HrNoticesPanel } from "@/components/hr/hr-notices-panel"
import { KudosReceivedCard } from "@/components/people/kudos-received-card"
import { useEvolutionData } from "@/hooks/use-evolution-data"
import { useHrNotices } from "@/hooks/use-hr-notices"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListItem,
  CardListRow,
  CardListRowMeta,
  CardListRowTitle,
  CardListRows,
} from "@/components/ui/card-list"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { MetricCard } from "@/components/ui/metric-card"
import { Overline } from "@/components/ui/overline"
import { Separator } from "@/components/ui/separator"
import { cn, formatListDate } from "@/lib/utils"
import { StatusBadge } from "@/components/ui/status-badge"
import { OBJECTIVE_STATUS_TONE, PROJECT_STATUS_TONE } from "@/lib/status-tone"
import {
  OBJECTIVE_STATUS_LABEL,
  PDI_DIMENSION_LABEL,
  type ObjectiveEntry,
} from "@/lib/objectives/store"
import {
  getProjectsServerSnapshot,
  getProjectsSnapshot,
  STATUS_LABEL,
  subscribeProjectsStore,
  TAB_LABEL,
  type ProjectEntry,
  type WorkspaceTab,
} from "@/lib/projects/store"
import type { LevelDef } from "@/lib/profile/types"
import { getRecordImpactText } from "@/lib/records/display"
import type { RecordEntry } from "@/lib/records/types"
import type { PresentationEntry } from "@/lib/presentations/store"

type ActivityItem = {
  id: string
  title: string
  description: string
  href: string
  date: string
  icon: LucideIcon
  label: string
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

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <Link href={item.href} className="block transition-colors hover:bg-muted/40">
      <CardListItem
        icon={
          <div className="icon-well flex size-6 items-center justify-center rounded-md">
            <item.icon className="size-3.5" />
          </div>
        }
        badges={
          <Badge variant="outline">
            {item.label}
          </Badge>
        }
        title={item.title}
        text={item.description}
        date={formatListDate(item.date)}
      />
    </Link>
  )
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

function ObjectiveRow({ objective }: { objective: ObjectiveEntry }) {
  const daysUntil = getDaysUntil(objective.deadline)
  const dimension = objective.dimensions[0]

  return (
    <Link href="/professional/objectives" className="block transition-colors hover:bg-muted/40">
      <CardListItem
        badges={
          <>
            <StatusBadge tone={OBJECTIVE_STATUS_TONE[objective.status]}>
              {OBJECTIVE_STATUS_LABEL[objective.status]}
            </StatusBadge>
            {dimension ? (
              <Badge variant="outline">
                {PDI_DIMENSION_LABEL[dimension]}
              </Badge>
            ) : null}
          </>
        }
        title={objective.title}
        date={
          <span className={daysUntil !== null && daysUntil < 0 ? "text-danger-foreground" : undefined}>
            {daysUntil === null
              ? "Sem prazo"
              : daysUntil < 0
                ? `${Math.abs(daysUntil)}d atraso`
                : `${daysUntil}d`}
          </span>
        }
      />
    </Link>
  )
}

function ProjectRow({ project }: { project: ProjectEntry & { workspace: WorkspaceTab } }) {
  return (
    <Link href={getProjectPath(project)} className="block transition-colors hover:bg-muted/40">
      <CardListRow>
        <div className="min-w-0">
          <CardListRowTitle className="truncate">{project.name}</CardListRowTitle>
          <CardListRowMeta>{TAB_LABEL[project.workspace]}</CardListRowMeta>
        </div>
        <StatusBadge tone={PROJECT_STATUS_TONE[project.status]} className="shrink-0">
          {STATUS_LABEL[project.status]}
        </StatusBadge>
      </CardListRow>
    </Link>
  )
}

function PresentationRow({ presentation }: { presentation: PresentationEntry }) {
  return (
    <Link href="/professional/presentations" className="block transition-colors hover:bg-muted/40">
      <CardListRow>
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <CardListRowTitle className="truncate">{presentation.title}</CardListRowTitle>
            <CardListRowMeta>{presentation.sharedWith || formatDate(presentation.date)}</CardListRowMeta>
          </div>
        </div>
      </CardListRow>
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
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Overline size="sm" className="text-accent-ink">
            Seu fluxo no Atlas
          </Overline>
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
                  className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/30 hover:text-accent-ink"
                >
                  {projectCount} projeto(s)
                </Link>
                <Link
                  href="/professional/objectives"
                  className="rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/30 hover:text-accent-ink"
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
          className="group relative m-2 overflow-hidden rounded-md bg-primary px-5 py-4 text-left text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-ring/40 md:m-3"
        >
          <div className="absolute -right-6 -top-8 size-28 rounded-full border border-primary-foreground/15" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 text-xs font-semibold">
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

function CareerProgressCard({
  ladder,
  currentLevelId,
  targetLevelId,
  targetRole,
  targetYear,
  readiness,
  recordCount,
  strongCount,
  className,
}: {
  ladder: LevelDef[]
  currentLevelId: string
  targetLevelId?: string
  targetRole?: string
  targetYear?: number | null
  readiness: number
  recordCount: number
  strongCount: number
  className?: string
}) {
  const evidenceLabel =
    recordCount === 0
      ? "Registre entregas para construir evidência para o próximo nível."
      : `${recordCount} ${recordCount === 1 ? "evidência sustenta" : "evidências sustentam"} sua evolução${
          strongCount ? ` · ${strongCount} ${strongCount === 1 ? "competência forte" : "competências fortes"}` : ""
        }.`

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex flex-col gap-5">
        <Trilha
          ladder={ladder}
          currentLevelId={currentLevelId}
          targetLevelId={targetLevelId}
          readiness={readiness}
          variant="hero"
        />
        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
          {evidenceLabel}
          {targetRole ? ` Meta: ${targetRole}${targetYear ? ` até ${targetYear}` : ""}.` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/professional/evolution/radar" className={buttonVariants({ size: "sm" })}>
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
  const {
    records,
    openCapture,
    objectives,
    presentations,
    readiness,
    profile,
    strongCount,
  } = useEvolutionData()
  const displayName = session?.name?.trim()
  const { notices: hrNotices } = useHrNotices(3)
  const projects = useSyncExternalStore(
    subscribeProjectsStore,
    getProjectsSnapshot,
    getProjectsServerSnapshot
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

  const latestProjects = useMemo(
    () => [...flatProjects].sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")).slice(0, 4),
    [flatProjects]
  )

  const recentActivity = useMemo(() => {
    const recordActivity = records.slice(0, 4).map(getRecordActivity)
    const objectiveActivity = objectives.slice(0, 4).map(getObjectiveActivity)
    return [...recordActivity, ...objectiveActivity]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
  }, [objectives, records])

  const kpiCards = (
    <>
      <MetricCard
        variant="card"
        label="Registros este mês"
        value={recordsThisMonth.length}
        icon={Zap}
        href="/professional/timeline"
        helper={`${records.length} no histórico`}
      />
      <MetricCard
        variant="card"
        label="Objetivos ativos"
        value={activeObjectives.length}
        icon={Target}
        href="/professional/objectives"
        helper={`${objectives.filter((item) => item.status === "done").length} concluídos`}
      />
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          session?.role === "gestor"
            ? "Visão geral"
            : displayName
              ? `Olá, ${displayName}`
              : "Olá"
        }
        description="O que está em andamento, o que virou evidência e onde vale focar agora."
      >
        <PageHeaderActions>
          <Button size="sm" onClick={() => openCapture()}>
            <Zap data-icon="inline-start" />
            Registrar progresso
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {/* Faixa de abertura: o que chegou (RH), o que falta fazer (Foco) e o que
          já foi notado (Elogios). Em lg três colunas ficariam com ~220px cada,
          então os elogios descem e ocupam a linha inteira; a partir de xl cabem
          as três lado a lado. */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          hrNotices.length > 0 ? "lg:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2"
        )}
      >
        {hrNotices.length > 0 ? <HrNoticesPanel hideWhenEmpty compact /> : null}

        <CardList>
          <CardListHeader
            title="Foco do ciclo"
            action={
              <Link
                href="/professional/objectives"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Objetivos
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            }
          />
          <CardListBody>
            {nextObjectives.length ? (
              <CardListRows>
                {nextObjectives.map((objective) => (
                  <ObjectiveRow key={objective.id} objective={objective} />
                ))}
              </CardListRows>
            ) : (
              <div className="px-4 py-4">
                <EmptyStateCard
                  icon={Target}
                  title="Nenhum objetivo ativo"
                  description="Escolha o que quer avançar neste ciclo."
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
              </div>
            )}
          </CardListBody>
        </CardList>

        <KudosReceivedCard
          className={cn(hrNotices.length > 0 && "lg:col-span-2 xl:col-span-1")}
        />
      </div>

      {/* Um terço para os dois KPIs empilhados, dois terços para a Trilha. Os
          KPIs são label + número + apoio: lado a lado sobrava metade do card
          vazio, e a Trilha, que precisa de largura para caber cinco nós com
          rótulo mais o medidor, ficava apertada em metade da fileira.
          `lg:grid-rows-2` faz os dois dividirem a altura da Trilha em vez de
          deixarem sobra embaixo. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-rows-2">{kpiCards}</div>

        <CareerProgressCard
          className="lg:col-span-2"
          ladder={profile.ladder}
          currentLevelId={profile.identity.levelId}
          targetLevelId={profile.goal.targetLevelId}
          targetRole={profile.goal.targetRole}
          targetYear={profile.goal.targetYear}
          readiness={readiness}
          recordCount={records.length}
          strongCount={strongCount}
        />
      </div>

      {/* Dois terços para o feed, um terço com Projetos e Apresentações
          empilhados. O feed é a lista mais pesada da página — até 5 linhas de
          badge + título + duas linhas de descrição + data, ~126px cada — e é
          quem precisa de largura; os outros dois são compactos e parecidos.
          Com 5 registros as duas colunas fecham quase iguais (697px contra
          750px); com poucos registros o feed fica curto e sobra vazio à
          esquerda. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <CardList className="lg:col-span-2">
          <CardListHeader
            title="Últimas movimentações"
            action={
              <Link
                href="/professional/timeline"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Ver registros
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            }
          />
          <CardListBody>
            {recentActivity.length ? (
              <CardListRows>
                {recentActivity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </CardListRows>
            ) : (
              <div className="px-4 py-4">
                <EmptyStateCard
                  icon={Zap}
                  title="Ainda sem registros nem objetivos"
                  description="Documente uma entrega ou defina uma meta para o ciclo."
                  action={
                    <Button size="sm" onClick={() => openCapture()}>
                      <Zap data-icon="inline-start" />
                      Criar registro
                    </Button>
                  }
                />
              </div>
            )}
          </CardListBody>
        </CardList>

        <div className="grid grid-cols-1 gap-4">
          <CardList>
            <CardListHeader
              title="Projetos recentes"
              action={<FolderOpen className="size-4 text-muted-foreground" />}
            />
            <CardListBody>
              {latestProjects.length ? (
                <CardListRows>
                  {latestProjects.map((project) => (
                    <ProjectRow key={`${project.workspace}-${project.id}`} project={project} />
                  ))}
                </CardListRows>
              ) : (
                <div className="px-4 py-4">
                  <EmptyStateCard
                    icon={FolderOpen}
                    title="Nenhum projeto cadastrado"
                    description="Os projetos que você criar aparecem aqui."
                  />
                </div>
              )}
            </CardListBody>
          </CardList>

          <CardList>
            <CardListHeader
              title="Apresentações"
              action={<Presentation className="size-4 text-muted-foreground" />}
            />
            <CardListBody className="flex flex-col gap-4 px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  variant="inset"
                  label="Realizadas"
                  value={completedPresentations.length}
                  icon={CheckCircle2}
                />
                <MetricCard
                  variant="inset"
                  label="Agendadas"
                  value={scheduledPresentations.length}
                  icon={Clock3}
                />
              </div>

              {presentations.length ? <Separator /> : null}

              {presentations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma apresentação registrada ainda.
                </p>
              ) : null}
            </CardListBody>
            {presentations.length ? (
              <CardListRows>
                {presentations.slice(0, 3).map((item) => (
                  <PresentationRow key={item.id} presentation={item} />
                ))}
              </CardListRows>
            ) : null}
          </CardList>
        </div>
      </div>

      {records.length === 0 ? (
        <WorkFlowGuide
          projectCount={activeProjects.length}
          objectiveCount={activeObjectives.length}
          recordCount={records.length}
          onRecord={() => openCapture()}
        />
      ) : null}
    </div>
  )
}

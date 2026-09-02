"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowUpRightIcon,
  FolderKanbanIcon,
  PinIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
} from "lucide-react"

import { ATUACOES } from "@/components/records/atuacao-picker"
import { AREAS } from "@/components/records/area-picker"
import { ImpactCallout } from "@/components/records/impact-callout"
import { SCOPES } from "@/components/records/impact-selector"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { PageHeader } from "@/components/ui/page-header"
import { useRecords } from "@/components/shell/records-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { FilterPill, FilterPillGroup } from "@/components/ui/filter-pill"
import { ImpactDots } from "@/components/ui/impact-dots"
import { Overline } from "@/components/ui/overline"
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge"
import { getProjectsServerSnapshot, getProjectsSnapshot, subscribeProjectsStore, type ProjectEntry, type WorkspaceTab } from "@/lib/projects/store"
import {
  emitTimelinePinsChange,
  getTimelinePinsServerSnapshot,
  getTimelinePinsSnapshot,
  saveTimelinePins,
  subscribeTimelinePinsStore,
} from "@/lib/timeline/pins-store"
import type { ImpactLevel, RecordEntry } from "@/lib/records/types"
import { HIGHLIGHT_DEFS, resolveHighlightTone, type HighlightTone } from "@/lib/records/highlights"
import { isInPeriod } from "@/lib/evolution/periods"
import { HIGHLIGHT_PERIOD_LABEL, type HighlightPeriod } from "@/lib/evolution/types"

type ImpactTypeFilter =
  | "all"
  | "strategy"
  | "efficiency"
  | "automation"
  | "communication"
  | "scale"
  | "ia"

type SeniorityFilter = "all" | "delivery" | "senior" | "leadership" | "strategic"
type StrategicCategoryFilter =
  | "all"
  | "produto"
  | "ux"
  | "design-system"
  | "engenharia"
  | "operacional"
  | "ia"
  | "cross-team"
  | "growth"

type SeniorityTier = Exclude<SeniorityFilter, "all">

interface TimelineProjectMeta extends ProjectEntry {
  workspace: WorkspaceTab
}

interface HighlightItem {
  label: string
  tone: HighlightTone
}

interface StoryItem {
  id: string
  title: string
  context: string
  solution: string
  impact: string
  roleLabel: string
  areaLabel: string
  scopeLabel: string
  impactLabel: string
  impactLevel: ImpactLevel
  impactType: Exclude<ImpactTypeFilter, "all">
  impactTypeLabel: string
  seniority: SeniorityTier
  seniorityLabel: string
  category: Exclude<StrategicCategoryFilter, "all">
  categoryLabel: string
  weightBadges: string[]
  strategicTags: string[]
  highlights: HighlightItem[]
  stack: string[]
  period: string
  projectName: string | null
  workspace: WorkspaceTab | null
  createdAt: string
  record: RecordEntry
  project: TimelineProjectMeta | null
}

const IMPACT_LEVEL_LABELS: Record<ImpactLevel, string> = {
  1: "Baixo",
  2: "Médio",
  3: "Alto",
  4: "Estratégico",
  5: "Transformacional",
}

const HIGHLIGHT_STATUS_TONE: Record<HighlightTone, StatusTone> = {
  violet: "impact",
  sky: "info",
  emerald: "success",
  amber: "warning",
}

function flattenProjects(allProjects: Record<WorkspaceTab, ProjectEntry[]>) {
  const items: TimelineProjectMeta[] = []
  ;(["professional", "personal", "freelancer"] as const).forEach((workspace) => {
    for (const project of allProjects[workspace] ?? []) {
      items.push({ ...project, workspace })
    }
  })
  return items
}

function formatMonthYear(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

function formatPeriod(project: TimelineProjectMeta | null, record: RecordEntry) {
  if (project?.started_at && project?.ended_at) {
    return `${formatMonthYear(project.started_at)} — ${formatMonthYear(project.ended_at)}`
  }
  if (project?.started_at) {
    return `${formatMonthYear(project.started_at)} — em andamento`
  }
  if (project?.ended_at) {
    return `Concluído em ${formatMonthYear(project.ended_at)}`
  }
  return new Date(record.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function toDisplayTag(value: string) {
  return value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function deriveSeniority(record: RecordEntry): { value: SeniorityTier; label: string } {
  if (record.impactLevel >= 5 || (record.impactLevel >= 4 && ["estratégia", "arquitetura"].includes(record.atuacao))) {
    return { value: "strategic", label: "Estratégico" }
  }

  if (record.atuacao === "liderança" || record.atuacao === "mentoria" || record.impactLevel >= 4) {
    return { value: "leadership", label: "Liderança" }
  }

  if (record.impactLevel >= 3 || record.atuacao === "arquitetura" || record.atuacao === "estratégia") {
    return { value: "senior", label: "Sênior" }
  }

  return { value: "delivery", label: "Execução" }
}

function deriveImpactType(record: RecordEntry): { value: Exclude<ImpactTypeFilter, "all">; label: string } {
  const text = normalizeToken(
    [record.enriched.context, record.enriched.objective, record.enriched.contribution, record.enriched.impact, record.tags.join(" ")]
      .filter(Boolean)
      .join(" ")
  )

  if (/(ia|ai first|openai|llm|gpt|inteligencia artificial)/.test(text)) {
    return { value: "ia", label: "IA First" }
  }
  if (/(automat|automa|workflow|pipeline)/.test(text)) {
    return { value: "automation", label: "Automação" }
  }
  if (/(escala|escalabil|padron|design system|reuso|foundation)/.test(text)) {
    return { value: "scale", label: "Escalabilidade" }
  }
  if (/(comunic|alinh|clareza|stakeholder|visibilidade)/.test(text)) {
    return { value: "communication", label: "Comunicação" }
  }
  if (/(eficien|agilidad|produtiv|retrabalho|tempo|operacional)/.test(text)) {
    return { value: "efficiency", label: "Ganho operacional" }
  }
  return { value: "strategy", label: "Clareza estratégica" }
}

function deriveCategory(record: RecordEntry): { value: Exclude<StrategicCategoryFilter, "all">; label: string } {
  const text = normalizeToken([record.tags.join(" "), record.enriched.contribution, record.enriched.impact].filter(Boolean).join(" "))

  if (/(ia|ai first|llm|openai|gpt)/.test(text)) return { value: "ia", label: "IA" }
  if (/(cross team|cross-team|multidisciplinar|multiare|stakeholder)/.test(text) || record.impactScope === "company") {
    return { value: "cross-team", label: "Cross-team" }
  }
  if (/(growth|conversao|adocao|acquisicao)/.test(text)) return { value: "growth", label: "Growth" }

  switch (record.area) {
    case "produto":
      return { value: "produto", label: "Produto" }
    case "ux":
      return { value: "ux", label: "UX / Design" }
    case "design-system":
      return { value: "design-system", label: "Design System" }
    case "engenharia":
      return { value: "engenharia", label: "Engenharia" }
    case "operacional":
    case "processo":
      return { value: "operacional", label: "Operacional" }
    default:
      return { value: "produto", label: "Produto" }
  }
}

function deriveWeightBadges(record: RecordEntry, project: TimelineProjectMeta | null) {
  const text = normalizeToken([record.enriched.contribution, record.enriched.impact, record.tags.join(" "), project?.name ?? ""].join(" "))
  const badges: string[] = []

  if (record.impactLevel >= 4) badges.push("Estratégico")
  if (record.impactScope === "company") badges.push("Global")
  if (record.atuacao === "liderança") badges.push("Liderança")
  if (/(ia|ai first|llm|openai|gpt)/.test(text)) badges.push("IA First")
  if (/(automat|workflow|pipeline)/.test(text)) badges.push("Automação")
  if (/(escala|escalabil|design system|padron|reuso)/.test(text)) badges.push("Escalável")
  if (record.area === "operacional" || /(operacional|processo)/.test(text)) badges.push("Operacional")
  if (project?.workspace === "professional") badges.push("Produto interno")

  return Array.from(new Set(badges)).slice(0, 4)
}

function deriveStrategicTags(record: RecordEntry, project: TimelineProjectMeta | null, categoryLabel: string) {
  const tags = new Set<string>([categoryLabel])

  record.tags.forEach((tag) => tags.add(toDisplayTag(tag)))
  if (record.impactScope === "company" || record.impactScope === "area") tags.add("Cross-team")
  if (project?.workspace === "freelancer") tags.add("Entrega externa")
  if (project?.workspace === "professional") tags.add("Contexto interno")

  return Array.from(tags).slice(0, 6)
}

function deriveHighlights(record: RecordEntry): HighlightItem[] {
  // Destaque manual tem prioridade sobre a derivação automática.
  const manual = record.highlight?.trim()
  if (manual) {
    return [{ label: manual, tone: resolveHighlightTone(manual) }]
  }

  const text = normalizeToken([record.enriched.impact, record.enriched.contribution, record.enriched.decisions].filter(Boolean).join(" "))
  const highlights: HighlightItem[] = []

  for (const def of HIGHLIGHT_DEFS) {
    if (def.regex.test(text)) highlights.push({ label: def.label, tone: def.tone })
  }

  if (highlights.length === 0) {
    if (record.impactLevel >= 4) highlights.push({ label: "Resultado estratégico", tone: "amber" })
    else if (record.area === "operacional" || record.area === "processo") highlights.push({ label: "Ganho operacional", tone: "sky" })
    else highlights.push({ label: "Impacto percebido", tone: "emerald" })
  }

  return highlights.slice(0, 3)
}

function getProjectForRecord(record: RecordEntry, projects: TimelineProjectMeta[]) {
  if (record.projectId) {
    const byId = projects.find((project) => project.id === record.projectId)
    if (byId) return byId
  }

  if (record.projectName) {
    return (
      projects.find((project) => normalizeToken(project.name) === normalizeToken(record.projectName ?? "")) ?? null
    )
  }

  return null
}

function buildStoryItems(records: RecordEntry[], projects: TimelineProjectMeta[]) {
  return records
    .map((record): StoryItem => {
      const project = getProjectForRecord(record, projects)
      const role = ATUACOES.find((item) => item.value === record.atuacao)
      const area = AREAS.find((item) => item.value === record.area)
      const scope = SCOPES.find((item) => item.value === record.impactScope)
      const seniority = deriveSeniority(record)
      const impactType = deriveImpactType(record)
      const category = deriveCategory(record)
      const weightBadges = deriveWeightBadges(record, project)
      const highlights = deriveHighlights(record)
      const strategicTags = deriveStrategicTags(record, project, category.label)

      return {
        id: record.id,
        title: record.enriched.title || project?.name || "Entrega registrada",
        context: record.enriched.context || record.enriched.objective || "Contexto não detalhado neste registro.",
        solution:
          record.enriched.contribution ||
          record.enriched.decisions ||
          "Solução não detalhada neste registro.",
        impact: record.enriched.impact || "Impacto ainda não descrito neste registro.",
        roleLabel: role?.label || "Contribuição",
        areaLabel: area?.label || "Entrega profissional",
        scopeLabel: scope?.label || "Impacto",
        impactLabel: IMPACT_LEVEL_LABELS[record.impactLevel],
        impactLevel: record.impactLevel,
        impactType: impactType.value,
        impactTypeLabel: impactType.label,
        seniority: seniority.value,
        seniorityLabel: seniority.label,
        category: category.value,
        categoryLabel: category.label,
        weightBadges,
        strategicTags,
        highlights,
        stack: project?.stack ?? [],
        period: formatPeriod(project, record),
        projectName: project?.name ?? record.projectName ?? null,
        workspace: project?.workspace ?? null,
        createdAt: record.createdAt,
        record,
        project,
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function buildFeaturedScore(item: StoryItem, pinnedIds: string[]) {
  return (pinnedIds.includes(item.id) ? 100 : 0) + item.impactLevel * 10 + item.highlights.length * 3 + item.weightBadges.length
}

type PeriodFilter = HighlightPeriod | "all"

const PERIOD_FILTER_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
  { value: "all", label: "Tudo" },
  ...(Object.keys(HIGHLIGHT_PERIOD_LABEL) as HighlightPeriod[]).map((value) => ({
    value,
    label: HIGHLIGHT_PERIOD_LABEL[value],
  })),
]

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <EmptyStateCard
      size="page"
      icon={FolderKanbanIcon}
      title="Comece pelo primeiro registro"
      description="Cada entrega documentada alimenta sua trajetória — contexto, impacto e senioridade ficam claros nos registros."
      action={
        <>
          <Button className="gap-1.5" onClick={onOpen}>
            <SparklesIcon className="size-4" />
            Registrar progresso
          </Button>
          <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
            Ver projetos
          </Link>
        </>
      }
    />
  )
}

function FeaturedStoryCard({
  item,
  pinned,
  onPinToggle,
  onOpen,
}: {
  item: StoryItem
  pinned: boolean
  onPinToggle: (id: string) => void
  onOpen: (record: RecordEntry) => void
}) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-border/60 bg-card p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <Overline size="sm" className="min-w-0">
          {item.projectName || item.areaLabel}
        </Overline>

        <FilterPill
          size="sm"
          active={pinned}
          onClick={() => onPinToggle(item.id)}
          className="inline-flex shrink-0 items-center gap-1"
        >
          <PinIcon className="size-3.5" />
          {pinned ? "Fixado" : "Fixar"}
        </FilterPill>
      </div>

      <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground">
        {item.title}
      </h2>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
        {item.impact}
      </p>

      {item.highlights[0] && (
        <div className="mt-3 rounded-xl border border-border/60 bg-background/55 px-3 py-2">
          <Overline size="sm">Destaque</Overline>
          <p className="mt-1 text-sm font-medium text-foreground/90">{item.highlights[0].label}</p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" onClick={() => onOpen(item.record)}>
          Abrir história
          <ArrowUpRightIcon className="size-3.5" />
        </Button>
      </div>
    </article>
  )
}

function StoryCard({
  item,
  pinned,
  onPinToggle,
  onOpen,
}: {
  item: StoryItem
  pinned: boolean
  onPinToggle: (id: string) => void
  onOpen: (record: RecordEntry) => void
}) {
  return (
    <div className="relative pl-0 md:pl-28">
      <div className="hidden md:absolute md:left-0 md:top-0 md:block md:w-24">
        <Overline>
          {new Date(item.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
        </Overline>
        <ImpactDots level={item.impactLevel} className="mt-2.5" />
      </div>

      <article className="rounded-lg border border-border/60 bg-card p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-card-hover">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Overline size="sm">
                {item.areaLabel}
              </Overline>
              <h2 className="line-clamp-2 text-xl font-semibold tracking-tight text-foreground sm:text-[1.3rem]">{item.title}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">{item.projectName || "Entrega profissional"}</span>
                <span className="hidden sm:inline text-muted-foreground/40">•</span>
                <span>{item.period}</span>
              </div>
            </div>

            <FilterPill
              size="sm"
              active={pinned}
              onClick={() => onPinToggle(item.id)}
              className="inline-flex shrink-0 items-center"
              aria-label={pinned ? "Desfixar entrega" : "Fixar entrega"}
            >
              <PinIcon className="size-3.5" />
            </FilterPill>
          </div>

          <ImpactCallout lines={2}>{item.impact}</ImpactCallout>

          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
            {item.highlights[0] ? (
              <StatusBadge tone={HIGHLIGHT_STATUS_TONE[item.highlights[0].tone]}>
                {item.highlights[0].label}
              </StatusBadge>
            ) : (
              <span />
            )}

            <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" onClick={() => onOpen(item.record)}>
              Abrir história completa
              <ArrowUpRightIcon className="size-3.5" />
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}

export default function TimelinePage() {
  const { records, openCapture, openDetail } = useRecords()
  const allProjects = useSyncExternalStore(subscribeProjectsStore, getProjectsSnapshot, getProjectsServerSnapshot)
  const pinnedIds = useSyncExternalStore(subscribeTimelinePinsStore, getTimelinePinsSnapshot, getTimelinePinsServerSnapshot)

  const [period, setPeriod] = useState<PeriodFilter>("all")

  const stories = useMemo(() => buildStoryItems(records, flattenProjects(allProjects)), [allProjects, records])

  const filteredStories = useMemo(() => {
    if (period === "all") return stories
    return stories.filter((item) => isInPeriod(item.createdAt, period))
  }, [period, stories])

  const featuredStories = useMemo(() => {
    return [...filteredStories]
      .sort((a, b) => buildFeaturedScore(b, pinnedIds) - buildFeaturedScore(a, pinnedIds))
      .slice(0, 3)
  }, [filteredStories, pinnedIds])

  const groupedStories = useMemo(() => {
    const groups = new Map<string, StoryItem[]>()
    for (const item of filteredStories) {
      const year = new Date(item.createdAt).getFullYear().toString()
      groups.set(year, [...(groups.get(year) ?? []), item])
    }
    return Array.from(groups.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, items]) => ({ year, items }))
  }, [filteredStories])

  function togglePin(id: string) {
    const next = pinnedIds.includes(id) ? pinnedIds.filter((item) => item !== id) : [id, ...pinnedIds]
    saveTimelinePins(next)
    emitTimelinePinsChange()
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Registros"
        description="Histórico das suas entregas, decisões e impactos."
      >
        <PageHeaderActions>
          <Button size="sm" onClick={() => openCapture()}>
            <SparklesIcon data-icon="inline-start" />
            Registrar progresso
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {stories.length === 0 ? (
        <EmptyState onOpen={() => openCapture()} />
      ) : (
        <>
          <FilterPillGroup aria-label="Filtrar por período">
            {PERIOD_FILTER_OPTIONS.map((option) => (
              <FilterPill
                key={option.value}
                active={period === option.value}
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </FilterPill>
            ))}
          </FilterPillGroup>

          {featuredStories.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <StarIcon className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">Entregas mais relevantes</h2>
              </div>
              <div className="grid gap-3 xl:grid-cols-3">
                {featuredStories.map((item) => (
                  <FeaturedStoryCard
                    key={item.id}
                    item={item}
                    pinned={pinnedIds.includes(item.id)}
                    onPinToggle={togglePin}
                    onOpen={openDetail}
                  />
                ))}
              </div>
            </section>
          )}

          {groupedStories.length === 0 ? (
            <section className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-6 py-16 text-center">
              <div className="mx-auto max-w-lg">
                <h2 className="text-lg font-semibold tracking-tight">Nenhuma entrega registrada ainda</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Registre uma entrega para começar a montar sua trajetória.
                </p>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <TargetIcon className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">Por ano</h2>
              </div>

              {groupedStories.map((group) => (
                <section key={group.year} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Overline>
                      {group.year}
                    </Overline>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <StoryCard
                        key={item.id}
                        item={item}
                        pinned={pinnedIds.includes(item.id)}
                        onPinToggle={togglePin}
                        onOpen={openDetail}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

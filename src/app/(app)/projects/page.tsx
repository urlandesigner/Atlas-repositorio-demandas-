"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { ArrowUpRight, FileText, FolderOpen, LayoutGrid, List, Plus } from "lucide-react"
import { useRecords } from "@/components/shell/records-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { FilterPill, FilterPillGroup } from "@/components/ui/filter-pill"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { PageHeader } from "@/components/ui/page-header"
import { PageBanner } from "@/components/ui/page-banner"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { PROJECT_STATUS_TONE } from "@/lib/status-tone"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  addProjectToCollection,
  createProjectFromForm,
  createProjectPath,
  emitProjectsChange,
  EMPTY_FORM,
  getProjectsServerSnapshot,
  getProjectsSnapshot,
  saveProjects,
  STATUS_LABEL,
  STATUS_OPTIONS,
  subscribeProjectsStore,
  type ProjectEntry,
  type ProjectForm,
} from "@/lib/projects/store"
import type { ProjectStatus } from "@/types"

const WORKSPACE = "professional" as const

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

function formatProjectPeriod(project: ProjectEntry) {
  if (project.started_at && project.ended_at) {
    return `${formatDate(project.started_at)} → ${formatDate(project.ended_at)}`
  }
  if (project.started_at) {
    return `${formatDate(project.started_at)} → em andamento`
  }
  if (project.ended_at) {
    return `Conclusão em ${formatDate(project.ended_at)}`
  }
  return "Sem período definido"
}

function ProjectCard({
  project,
  recordCount,
  onRecord,
}: {
  project: ProjectEntry
  recordCount: number
  onRecord: () => void
}) {
  return (
    <Card className="h-full hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-card-hover">
      <Link
        href={createProjectPath(WORKSPACE, project.id)}
        className="flex flex-1 cursor-pointer flex-col gap-4"
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-md font-semibold leading-snug">{project.name}</h3>
            <StatusBadge tone={PROJECT_STATUS_TONE[project.status]} className="shrink-0">
              {STATUS_LABEL[project.status]}
            </StatusBadge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 pt-0">
          <p
            className={`truncate text-xs ${
              project.description?.trim() ? "text-muted-foreground" : "text-muted-foreground/60"
            }`}
          >
            {project.description?.trim() || "Sem descrição"}
          </p>

          <p
            className={`truncate text-xs ${
              project.started_at || project.ended_at ? "text-muted-foreground" : "text-muted-foreground/60"
            }`}
          >
            {formatProjectPeriod(project)}
          </p>
        </CardContent>
      </Link>

      <CardFooter className="justify-between gap-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="size-3.5" />
          {recordCount === 1 ? "1 entrega" : `${recordCount} entregas`}
        </span>
        <Button size="sm" variant="ghost" onClick={onRecord}>
          <Plus data-icon="inline-start" />
          Registrar
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProjectTable({
  projects,
  getRecordCount,
  onRecord,
}: {
  projects: ProjectEntry[]
  getRecordCount: (project: ProjectEntry) => number
  onRecord: (project: ProjectEntry) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/25 text-3xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="w-[38%] px-4 py-3 font-semibold">Projeto</th>
              <th className="w-[15%] px-4 py-3 font-semibold">Status</th>
              <th className="w-[20%] px-4 py-3 font-semibold">Período</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Entregas</th>
              <th className="w-[15%] px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const recordCount = getRecordCount(project)

              return (
                <tr
                  key={project.id}
                  className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={createProjectPath(WORKSPACE, project.id)}
                      className="group flex min-w-0 items-center gap-3"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors group-hover:border-primary/25 group-hover:text-accent-ink">
                        <FolderOpen className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-md font-semibold leading-snug text-foreground transition-colors group-hover:text-accent-ink">
                          {project.name}
                        </span>
                        <span className="mt-0.5 block max-w-md truncate text-xs text-muted-foreground">
                          {project.description?.trim() || "Sem descrição"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge tone={PROJECT_STATUS_TONE[project.status]} className="shrink-0">
                      {STATUS_LABEL[project.status]}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {formatProjectPeriod(project)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="size-3.5" />
                      {recordCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onRecord(project)}>
                        <Plus data-icon="inline-start" />
                        Registrar
                      </Button>
                      <Link
                        href={createProjectPath(WORKSPACE, project.id)}
                        aria-label={`Abrir ${project.name}`}
                        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NewProjectSheet({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (form: ProjectForm) => void
}) {
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM)

  function set(field: keyof ProjectForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    onSubmit(form)
    setForm(EMPTY_FORM)
  }

  function handleClose() {
    setForm(EMPTY_FORM)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && handleClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[45vw] sm:data-[side=right]:max-w-[45vw]" side="right" size="custom">
        <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="text-base">Novo projeto</SheetTitle>
          <p className="text-xs text-muted-foreground">Profissional</p>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <Input placeholder="Nome do projeto" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={(status) => status && set("status", status as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) => STATUS_LABEL[value as ProjectStatus]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <Textarea
                placeholder="Sobre o projeto..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Stack</label>
              <Input
                placeholder="Ex: Next.js, TailwindCSS, Vercel"
                value={form.stack}
                onChange={(e) => set("stack", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separe por vírgula</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data de início</label>
              <Input type="date" value={form.started_at} onChange={(e) => set("started_at", e.target.value)} />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex flex-row gap-2 border-t px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!form.name.trim()}>
            Adicionar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default function ProjectsPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const { records, openCapture } = useRecords()
  const allProjects = useSyncExternalStore(subscribeProjectsStore, getProjectsSnapshot, getProjectsServerSnapshot)

  const projects = [...allProjects[WORKSPACE]]
    .filter((project) => statusFilter === "all" || project.status === statusFilter)
    .sort((a, b) => {
      if (!a.started_at && !b.started_at) return a.name.localeCompare(b.name, "pt-BR")
      if (!a.started_at) return 1
      if (!b.started_at) return -1
      return a.started_at.localeCompare(b.started_at) || a.name.localeCompare(b.name, "pt-BR")
    })

  function handleAdd(form: ProjectForm) {
    const entry = createProjectFromForm(WORKSPACE, form)
    const next = addProjectToCollection(allProjects, WORKSPACE, entry)
    saveProjects(next)
    emitProjectsChange()
    setIsAdding(false)
  }

  function getRecordCount(project: ProjectEntry) {
    return records.filter(
      (record) =>
        record.projectId === project.id ||
        record.projectName?.trim().toLocaleLowerCase("pt-BR") ===
          project.name.trim().toLocaleLowerCase("pt-BR")
    ).length
  }

  function handleRecord(project: ProjectEntry) {
    openCapture({ project: { id: project.id, name: project.name } })
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Projetos"
          description="Entregas e iniciativas em andamento"
        >
          <PageHeaderActions>
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus data-icon="inline-start" />
              Novo projeto
            </Button>
          </PageHeaderActions>
        </PageHeader>

        <PageBanner
          title="Para que serve esta página"
          description="Aqui você organiza os projetos e contextos em que atua. Cadastre um projeto novo, filtre pelo status logo abaixo e use “Registrar” em cada card sempre que tiver uma entrega para documentar — isso alimenta seu histórico de evolução de carreira."
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterPillGroup aria-label="Filtrar por status">
            <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              Todos
            </FilterPill>
            {STATUS_OPTIONS.map((status) => (
              <FilterPill
                key={status}
                active={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              >
                {STATUS_LABEL[status]}
              </FilterPill>
            ))}
          </FilterPillGroup>

          <SegmentedControl aria-label="Visualização dos projetos">
            <SegmentedControlItem active={viewMode === "grid"} onClick={() => setViewMode("grid")}>
              <LayoutGrid className="size-3.5" />
              Blocos
            </SegmentedControlItem>
            <SegmentedControlItem active={viewMode === "table"} onClick={() => setViewMode("table")}>
              <List className="size-3.5" />
              Tabela
            </SegmentedControlItem>
          </SegmentedControl>
        </div>

        {projects.length === 0 ? (
          <EmptyStateCard
            size="page"
            icon={FolderOpen}
            title="Nenhum projeto ainda"
            description="Cadastre onde você está atuando."
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                recordCount={getRecordCount(project)}
                onRecord={() => handleRecord(project)}
              />
            ))}
          </div>
        ) : (
          <ProjectTable
            projects={projects}
            getRecordCount={getRecordCount}
            onRecord={handleRecord}
          />
        )}
      </div>

      <NewProjectSheet
        key={isAdding ? "open" : "closed"}
        open={isAdding}
        onClose={() => setIsAdding(false)}
        onSubmit={handleAdd}
      />
    </>
  )
}

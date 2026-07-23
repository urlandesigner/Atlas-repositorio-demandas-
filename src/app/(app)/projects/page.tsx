"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { ArrowUpRight, FileText, FolderOpen, LayoutGrid, List, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecords } from "@/components/shell/records-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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

const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  not_started: "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  paused: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  closed: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  inactive: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

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
    <Card className="h-full hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_14px_28px_rgba(15,23,42,0.075)]">
      <Link
        href={createProjectPath(WORKSPACE, project.id)}
        className="flex flex-1 cursor-pointer flex-col gap-4"
      >
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-medium">{project.name}</h3>
            <Badge variant="outline" className={cn("shrink-0 font-normal", STATUS_BADGE_CLASS[project.status])}>
              {STATUS_LABEL[project.status]}
            </Badge>
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
    <div className="overflow-hidden rounded-[12px] border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/25 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors group-hover:border-primary/25 group-hover:text-primary">
                        <FolderOpen className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground transition-colors group-hover:text-primary">
                          {project.name}
                        </span>
                        <span className="mt-0.5 block max-w-md truncate text-xs text-muted-foreground">
                          {project.description?.trim() || "Sem descrição"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 font-normal", STATUS_BADGE_CLASS[project.status])}
                    >
                      {STATUS_LABEL[project.status]}
                    </Badge>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="icon-well flex size-10 items-center justify-center rounded-full">
        <FolderOpen className="size-5" />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Nenhum projeto ainda. Cadastre onde você está atuando.
      </p>
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
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[45vw] sm:data-[side=right]:max-w-[45vw]" side="right">
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
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entregas e iniciativas em andamento</p>
          </div>
          <PageHeaderActions>
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="size-4" />
              Novo projeto
            </Button>
          </PageHeaderActions>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </Button>
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
              >
                {STATUS_LABEL[status]}
              </Button>
            ))}
          </div>

          <div
            className="inline-flex w-fit items-center rounded-lg border border-border bg-card p-1"
            role="group"
            aria-label="Visualização dos projetos"
          >
            <button
              type="button"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
              Blocos
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                viewMode === "table"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <List className="size-3.5" />
              Tabela
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <EmptyState />
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

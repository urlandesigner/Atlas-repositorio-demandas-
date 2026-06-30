"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { FolderOpen, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

function ProjectCard({ project }: { project: ProjectEntry }) {
  return (
    <Link href={createProjectPath(WORKSPACE, project.id)} className="block">
      <Card className="h-full cursor-pointer hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_14px_28px_rgba(15,23,42,0.075)]">
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
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="size-5 text-muted-foreground" />
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

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entregas e iniciativas em andamento</p>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-4" />
            Novo projeto
          </Button>
        </div>

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

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
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

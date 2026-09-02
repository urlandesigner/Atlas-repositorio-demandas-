"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import { useParams, useRouter } from "next/navigation"
import type { ProjectStatus } from "@/types"
import { ImpactCallout } from "@/components/records/impact-callout"
import { useRecords } from "@/components/shell/records-provider"
import type { RecordEntry } from "@/lib/records/types"
import { getRecordImpactText } from "@/lib/records/display"
import {
  emitProjectsChange,
  findProject,
  getProjectsServerSnapshot,
  getProjectsSnapshot,
  isWorkspaceTab,
  normalizeProjectForWorkspace,
  saveProjects,
  STATUS_LABEL,
  STATUS_OPTIONS,
  subscribeProjectsStore,
  type PaymentEntry,
  type ProjectEntry,
  type ProjectLinkEntry,
  type ProjectTimelineEntry,
  type TimelineEventType,
  type WorkspaceTab,
} from "@/lib/projects/store"
import { cn } from "@/lib/utils"
import { getClientsServerSnapshot, getClientsSnapshot, subscribeClientsStore } from "@/lib/clients/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { CardList, CardListHeader } from "@/components/ui/card-list"
import { Input } from "@/components/ui/input"
import { ListRowButton } from "@/components/ui/list-row-button"
import { Overline } from "@/components/ui/overline"
import { Progress } from "@/components/ui/progress"
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
  Activity,
  CalendarDays,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Flag,
  FolderOpen,
  Globe,
  GitBranch,
  Layers3,
  Link2,
  Palette,
  Pencil,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react"

const LINK_KIND_STYLES = {
  figma: {
    icon: Palette,
    className: "border-border bg-muted/70 text-muted-foreground",
  },
  github: {
    icon: GitBranch,
    className: "border-border bg-muted/70 text-muted-foreground",
  },
  vercel: {
    icon: Rocket,
    className: "border-border bg-muted/70 text-muted-foreground",
  },
  notion: {
    icon: FileText,
    className: "border-border bg-muted/70 text-muted-foreground",
  },
  jira: {
    icon: Layers3,
    className: "border-border bg-muted/70 text-muted-foreground",
  },
  production: {
    icon: Globe,
    className: "border-success/20 bg-success/10 text-success-foreground",
  },
  staging: {
    icon: Rocket,
    className: "border-warning/20 bg-warning/10 text-warning-foreground",
  },
  default: {
    icon: Link2,
    className: "border-border bg-muted/70 text-muted-foreground",
  },
} as const

const TIMELINE_EVENT_LABEL: Record<TimelineEventType, string> = {
  created: "Projeto criado",
  edited: "Edição",
  payment: "Pagamento",
  status: "Status",
  deploy: "Deploy",
  update: "Atualização",
  observation: "Observação",
}

function normalizeLinkUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function getLinkKind(link: ProjectLinkEntry) {
  const value = `${link.label} ${link.url}`.toLowerCase()
  if (value.includes("figma")) return "figma"
  if (value.includes("github") || value.includes("gitlab")) return "github"
  if (value.includes("vercel")) return "vercel"
  if (value.includes("notion")) return "notion"
  if (value.includes("jira") || value.includes("atlassian")) return "jira"
  if (value.includes("production") || value.includes("produção") || value.includes("prod.")) return "production"
  if (value.includes("staging") || value.includes("stage") || value.includes("homolog")) return "staging"
  return "default"
}

function getSimplifiedDomain(url: string) {
  try {
    return new URL(normalizeLinkUrl(url)).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "")
  }
}

function getTimelineEventMeta(type: TimelineEventType) {
  switch (type) {
    case "created":
      return { icon: FolderOpen, className: "border-border bg-muted/70 text-muted-foreground" }
    case "edited":
      return { icon: Pencil, className: "border-border bg-muted/70 text-muted-foreground" }
    case "payment":
      return { icon: CreditCard, className: "border-success/20 bg-success/10 text-success-foreground" }
    case "status":
      return { icon: Flag, className: "border-warning/20 bg-warning/10 text-warning-foreground" }
    case "deploy":
      return { icon: Rocket, className: "border-info/20 bg-info/10 text-info-foreground" }
    case "update":
      return { icon: Activity, className: "border-border bg-muted/70 text-muted-foreground" }
    case "observation":
      return { icon: FileText, className: "border-border bg-muted/70 text-muted-foreground" }
  }
}

function formatFullDate(iso: string | null) {
  if (!iso) return "sem data definida"
  return new Date(iso).toLocaleDateString("pt-BR")
}

function formatUpdatedAgo(iso?: string) {
  if (!iso) return "Atualizado hoje"
  const diffInMs = Date.now() - new Date(iso).getTime()
  const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)))
  if (diffInDays === 0) return "Atualizado hoje"
  if (diffInDays === 1) return "Atualizado há 1 dia"
  return `Atualizado há ${diffInDays} dias`
}

function formatTimelineTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function getTimelineDateLabel(iso: string) {
  const target = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (target.toDateString() === today.toDateString()) return "Hoje"
  if (target.toDateString() === yesterday.toDateString()) return "Ontem"
  return target.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

function getProjectProgress(
  status: ProjectStatus,
  startedAt: string | null,
  endedAt: string | null
) {
  if (status === "closed") return 100
  if (status === "not_started") return 0

  // Progresso real: posição de hoje dentro do período planejado do projeto.
  if (startedAt && endedAt) {
    const start = new Date(startedAt).getTime()
    const end = new Date(endedAt).getTime()
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      const ratio = (Date.now() - start) / (end - start)
      return Math.min(99, Math.max(1, Math.round(ratio * 100)))
    }
  }

  // Sem período definido não há como medir avanço: indicador mínimo por status.
  return status === "active" ? 5 : 0
}

function normalizeLinksForComparison(links: ProjectLinkEntry[]) {
  return links.map((link) => ({
    label: link.label.trim(),
    url: normalizeLinkUrl(link.url),
  }))
}

function buildAutomaticTimelineEvents(previous: ProjectEntry, next: ProjectEntry) {
  const events: ProjectTimelineEntry[] = []

  if (previous.status !== next.status) {
    events.push(
      {
        id: crypto.randomUUID(),
        type: "status",
        description: `Status alterado de ${STATUS_LABEL[previous.status]} para ${STATUS_LABEL[next.status]}.`,
        created_at: new Date().toISOString(),
        user_name: "Você",
      }
    )
  }

  const detailChanges: string[] = []
  if (previous.name !== next.name) detailChanges.push("nome")
  if ((previous.clientName ?? "") !== (next.clientName ?? "")) detailChanges.push("cliente")
  if ((previous.description ?? "") !== (next.description ?? "")) detailChanges.push("descrição")

  if (detailChanges.length > 0) {
    events.push({
      id: crypto.randomUUID(),
      type: "edited",
      description: `Detalhes principais atualizados: ${detailChanges.join(", ")}.`,
      created_at: new Date().toISOString(),
      user_name: "Você",
    })
  }

  if (previous.started_at !== next.started_at || previous.ended_at !== next.ended_at) {
    events.push({
      id: crypto.randomUUID(),
      type: "update",
      description: `Período do projeto atualizado para ${formatFullDate(next.started_at)} → ${formatFullDate(next.ended_at)}.`,
      created_at: new Date().toISOString(),
      user_name: "Você",
    })
  }

  const previousLinks = normalizeLinksForComparison(previous.links)
  const nextLinks = normalizeLinksForComparison(next.links)
  if (JSON.stringify(previousLinks) !== JSON.stringify(nextLinks)) {
    const changedDeployLink = [...previousLinks, ...nextLinks].some((link) => {
      const kind = getLinkKind(link)
      return kind === "production" || kind === "staging" || kind === "vercel"
    })

    events.push({
      id: crypto.randomUUID(),
      type: changedDeployLink ? "deploy" : "update",
      description: changedDeployLink
        ? "Links de ambiente e deploy foram atualizados."
        : "Links importantes do projeto foram atualizados.",
      created_at: new Date().toISOString(),
      user_name: "Você",
    })
  }

  if (previous.value !== next.value || previous.billing_date !== next.billing_date) {
    events.push({
      id: crypto.randomUUID(),
      type: "update",
      description: "Dados financeiros do projeto foram atualizados.",
      created_at: new Date().toISOString(),
      user_name: "Você",
    })
  }

  if ((previous.observations ?? "").trim() !== (next.observations ?? "").trim()) {
    events.push({
      id: crypto.randomUUID(),
      type: "observation",
      description: !(next.observations ?? "").trim()
        ? "Observações removidas do projeto."
        : (previous.observations ?? "").trim()
          ? "Observações do projeto foram atualizadas."
          : "Observações adicionadas ao projeto.",
      created_at: new Date().toISOString(),
      user_name: "Você",
    })
  }

  return events
}

function DetailSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <CardList className="border-border/70">
      <CardListHeader title={title} description={description} action={action} />
      <CardContent className="space-y-4 px-4 py-4">{children}</CardContent>
    </CardList>
  )
}

function ProjectDetailSurface({
  workspace,
  project,
}: {
  workspace: WorkspaceTab
  project: ProjectEntry
}) {
  const router = useRouter()
  const allProjects = useSyncExternalStore(subscribeProjectsStore, getProjectsSnapshot, getProjectsServerSnapshot)
  const clients = useSyncExternalStore(subscribeClientsStore, getClientsSnapshot, getClientsServerSnapshot)
  const showFreelancerFields = workspace === "freelancer"
  const [editName, setEditName] = useState(project.name)
  const [editClientId, setEditClientId] = useState<string | null>(project.clientId ?? null)
  const [editDescription, setEditDescription] = useState(project.description ?? "")
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status)
  const [editStartedAt, setEditStartedAt] = useState(project.started_at ?? "")
  const [editEndedAt, setEditEndedAt] = useState(project.ended_at ?? "")
  const [editObs, setEditObs] = useState(project.observations ?? "")
  const [editValue, setEditValue] = useState(project.value != null ? String(project.value) : "")
  const [editLinks, setEditLinks] = useState<ProjectLinkEntry[]>(project.links)
  const [editTimeline, setEditTimeline] = useState<ProjectTimelineEntry[]>(project.timeline ?? [])
  const [isLinkComposerOpen, setIsLinkComposerOpen] = useState(false)
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null)
  const [linkDraft, setLinkDraft] = useState<ProjectLinkEntry>({ label: "", url: "" })
  const defaultPaymentType = workspace === "freelancer" ? "income" : "expense"
  const [addingPayment, setAddingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    type: defaultPaymentType as "income" | "expense",
    notes: "",
  })

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [clients]
  )
  const inferredClientId = useMemo(() => {
    const projectClientName = project.clientName?.trim().toLowerCase()
    if (!projectClientName) return ""
    return sortedClients.find((client) => client.name.trim().toLowerCase() === projectClientName)?.id ?? ""
  }, [project.clientName, sortedClients])
  const activeClientId = editClientId === null ? (project.clientId ?? inferredClientId ?? "") : editClientId
  const selectedClient = useMemo(
    () => sortedClients.find((client) => client.id === activeClientId) ?? null,
    [activeClientId, sortedClients]
  )
  const clientDisplayName = selectedClient?.name ?? (editClientId === null ? (project.clientName?.trim() ?? "") : "")

  const groupedTimeline = useMemo(() => {
    const sorted = [...editTimeline].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const groups = new Map<string, ProjectTimelineEntry[]>()
    for (const event of sorted) {
      const label = getTimelineDateLabel(event.created_at)
      groups.set(label, [...(groups.get(label) ?? []), event])
    }
    return Array.from(groups.entries()).map(([label, events]) => ({ label, events }))
  }, [editTimeline])

  const commandCenter = useMemo(() => {
    return {
      progress: getProjectProgress(
        editStatus,
        editStartedAt || project.started_at,
        editEndedAt || project.ended_at
      ),
      updatedLabel: formatUpdatedAgo(project.updated_at),
      startedLabel: formatFullDate(editStartedAt || project.started_at),
    }
  }, [editStartedAt, editEndedAt, editStatus, project.started_at, project.ended_at, project.updated_at])

  const { openCapture, openDetail, records, updateExistingRecord, deleteExistingRecord } = useRecords()

  const linkedRecords = useMemo(
    () => records.filter((r) => r.projectId === project.id || r.projectName?.trim().toLowerCase() === project.name.trim().toLowerCase()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [records, project.id, project.name]
  )

  function persist(updated: ProjectEntry) {
    const next = {
      ...allProjects,
      [workspace]: allProjects[workspace].map((item) =>
        item.id === updated.id ? normalizeProjectForWorkspace(workspace, updated) : item
      ),
    }
    saveProjects(next)
    emitProjectsChange()
  }

  function buildUpdatedProject(extra: Partial<ProjectEntry> = {}) {
    return {
      ...project,
      name: editName.trim() || project.name,
      clientId: showFreelancerFields ? (activeClientId || null) : null,
      clientName: showFreelancerFields
        ? selectedClient?.name ?? (editClientId === null ? (project.clientName?.trim() || undefined) : undefined)
        : undefined,
      description: editDescription.trim() || null,
      status: editStatus,
      stack: project.stack,
      started_at: editStartedAt || null,
      ended_at: editEndedAt || null,
      value: showFreelancerFields
        ? (editValue.trim() && Number.isFinite(Number(editValue)) ? Number(editValue) : null)
        : null,
      billing_date: showFreelancerFields ? (project.billing_date ?? null) : null,
      observations: editObs.trim() || null,
      links: editLinks,
      timeline: [...editTimeline].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      updated_at: new Date().toISOString(),
      ...extra,
    } satisfies ProjectEntry
  }

  function handleSave() {
    if (!editName.trim()) return
    const nextProject = buildUpdatedProject()
    const automaticEvents = buildAutomaticTimelineEvents(project, nextProject)
    const updatedTimeline = [...automaticEvents, ...editTimeline].sort((a, b) => b.created_at.localeCompare(a.created_at))
    persist({ ...nextProject, timeline: updatedTimeline })
    router.push(`/projects/${workspace}`)
  }

  function handleReset() {
    setEditName(project.name)
    setEditClientId(project.clientId ?? null)
    setEditDescription(project.description ?? "")
    setEditStatus(project.status)
    setEditStartedAt(project.started_at ?? "")
    setEditEndedAt(project.ended_at ?? "")
    setEditObs(project.observations ?? "")
    setEditValue(project.value != null ? String(project.value) : "")
    setEditLinks(project.links)
    setEditTimeline(project.timeline ?? [])
    setIsLinkComposerOpen(false)
    setEditingLinkIndex(null)
    setLinkDraft({ label: "", url: "" })
  }

  function handleEditLink(index: number) {
    setEditingLinkIndex(index)
    setLinkDraft(editLinks[index])
    setIsLinkComposerOpen(true)
  }

  function handleRemoveLink(index: number) {
    setEditLinks((current) => current.filter((_, currentIndex) => currentIndex !== index))
    if (editingLinkIndex === index) {
      setEditingLinkIndex(null)
      setLinkDraft({ label: "", url: "" })
      setIsLinkComposerOpen(false)
    }
  }

  function handleCancelLinkEdition() {
    setEditingLinkIndex(null)
    setLinkDraft({ label: "", url: "" })
    setIsLinkComposerOpen(false)
  }

  function handleSaveLink() {
    if (!linkDraft.label.trim() || !linkDraft.url.trim()) return
    const nextLink = { label: linkDraft.label.trim(), url: normalizeLinkUrl(linkDraft.url) }
    setEditLinks((current) => {
      if (editingLinkIndex === null) return [nextLink, ...current]
      return current.map((link, index) => (index === editingLinkIndex ? nextLink : link))
    })
    setEditingLinkIndex(null)
    setLinkDraft({ label: "", url: "" })
    setIsLinkComposerOpen(false)
  }

  function handleRegisterPayment() {
    if (!paymentForm.date || !paymentForm.amount) return
    const amount = parseFloat(paymentForm.amount)
    if (Number.isNaN(amount)) return

    const payment: PaymentEntry = {
      id: crypto.randomUUID(),
      date: paymentForm.date,
      amount,
      type: paymentForm.type,
      notes: paymentForm.notes.trim() || null,
    }

    const paymentLabel = payment.type === "expense" ? "Despesa registrada" : "Pagamento registrado"
    const paymentDescription = `${paymentLabel} de ${payment.amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}${payment.notes ? ` (${payment.notes})` : ""}.`

    const updatedTimeline = [
      {
        id: crypto.randomUUID(),
        type: "payment" as const,
        description: paymentDescription,
        created_at: payment.date,
        user_name: "Você",
      },
      ...editTimeline,
    ].sort((a, b) => b.created_at.localeCompare(a.created_at))

    const updatedProject = buildUpdatedProject({
      payments: [payment, ...project.payments],
      timeline: updatedTimeline,
    })

    setEditTimeline(updatedTimeline)
    persist(updatedProject)
    setAddingPayment(false)
    setPaymentForm({
      date: new Date().toISOString().split("T")[0],
      amount: "",
      type: defaultPaymentType,
      notes: "",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={editName}
        description="Página dedicada para acompanhar decisões, entregas e contexto operacional deste projeto."
        descriptionClassName="max-w-2xl"
      >
        <PageHeaderActions>
          <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" onClick={handleReset}>
            Desfazer
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none" onClick={handleSave} disabled={!editName.trim()}>
            Salvar alterações
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <Card className="border-border/70 shadow-card">
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
            <div className="min-w-0 space-y-1.5 lg:shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={PROJECT_STATUS_TONE[editStatus]} className="rounded-full px-2.5 py-1 text-2xs font-medium shadow-none">
                  {STATUS_LABEL[editStatus]}
                </StatusBadge>
                {showFreelancerFields && clientDisplayName && (
                  <Overline>
                    {clientDisplayName}
                  </Overline>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" />
                  {commandCenter.updatedLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Projeto iniciado em {commandCenter.startedLabel}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 lg:flex-1">
              <Overline className="flex items-center justify-between">
                <span>Progressão</span>
                <span>{commandCenter.progress}%</span>
              </Overline>
              <Progress
                value={commandCenter.progress}
                size="md"
                tone={PROJECT_STATUS_TONE[editStatus]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <div className="space-y-6">
          <DetailSection title="Contexto" description="Nome, status e descrição do projeto.">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome do projeto</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome do projeto" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
                <Select value={editStatus} onValueChange={(status) => setEditStatus(status as ProjectStatus)}>
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
            </div>

            {showFreelancerFields && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</label>
                <Select
                  value={activeClientId}
                  onValueChange={(clientId) => setEditClientId((clientId as string | null) ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value) =>
                        sortedClients.find((client) => client.id === value)?.name ?? "Selecione um cliente"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Selecione um cliente</SelectItem>
                    {sortedClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sortedClients.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Nenhum cliente cadastrado ainda. Abra a tela{" "}
                    <Link href="/freelancer/clients" className="font-medium text-foreground underline underline-offset-4">
                      Clientes
                    </Link>{" "}
                    para cadastrar.
                  </p>
                ) : !selectedClient && clientDisplayName ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cliente atual salvo no projeto: <span className="font-medium text-foreground">{clientDisplayName}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Selecione um cliente da sua base freelancer.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Descrição</label>
              <Textarea
                placeholder="Sobre o projeto..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </DetailSection>

          <DetailSection
            title={`Entregas registradas${linkedRecords.length > 0 ? ` (${linkedRecords.length})` : ""}`}
            description="Entregas documentadas neste projeto — aparecem em Registros."
            action={
              linkedRecords.length > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    openCapture({ project: { id: project.id, name: project.name } })
                  }
                >
                  <Plus className="size-4" />
                  Registrar entrega
                </Button>
              ) : undefined
            }
          >
            {linkedRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-border/60 bg-muted/15 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma entrega registrada ainda.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    openCapture({ project: { id: project.id, name: project.name } })
                  }
                >
                  <Plus className="size-4" />
                  Registrar primeira entrega
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedRecords.map((record: RecordEntry) => (
                  <ListRowButton
                    key={record.id}
                    onClick={() => openDetail(record)}
                    className="flex-col items-stretch gap-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium text-foreground">{record.enriched.title || "Entrega sem título"}</p>
                      <span className="shrink-0 text-2xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <ImpactCallout size="sm" lines={2} className="mt-2.5">
                      {getRecordImpactText(record) || "—"}
                    </ImpactCallout>
                  </ListRowButton>
                ))}
              </div>
            )}
          </DetailSection>

          <DetailSection title="Histórico" description="Mudanças de status, links, período e pagamentos.">
            <div className="rounded-[12px] border border-border/70 bg-muted/10">
              {groupedTimeline.length === 0 ? (
                <div className="px-4 py-5 text-sm text-muted-foreground">Nenhum evento registrado ainda.</div>
              ) : (
                <ScrollArea className="max-h-[52rem]">
                  <div className="space-y-6 p-4 sm:p-5">
                    {groupedTimeline.map((group) => (
                      <div key={group.label}>
                        <div className="mb-3 flex items-center gap-3">
                          <Overline>{group.label}</Overline>
                          <div className="h-px flex-1 bg-border/70" />
                        </div>
                        <div className="space-y-3">
                          {group.events.map((event, index) => {
                            const meta = getTimelineEventMeta(event.type)
                            const Icon = meta.icon
                            return (
                              <div key={event.id} className="group relative pl-12">
                                {index !== group.events.length - 1 && (
                                  <div className="absolute left-[1.18rem] top-10 h-[calc(100%+0.9rem)] w-px bg-border/70" />
                                )}
                                <div className={cn("absolute left-0 top-0 flex size-9 items-center justify-center rounded-xl border shadow-sm", meta.className)}>
                                  <Icon className="size-4" />
                                </div>
                                <div className="rounded-[12px] border border-border/70 bg-background/90 p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-card-hover">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-2xs font-medium">
                                          {TIMELINE_EVENT_LABEL[event.type]}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{formatTimelineTime(event.created_at)}</span>
                                      </div>
                                      <p className="mt-2 text-sm leading-6 text-foreground">{event.description}</p>
                                    </div>
                                    <div className="shrink-0 text-xs text-muted-foreground">{event.user_name}</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="Links importantes">
            <div className="flex items-start justify-end gap-3">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setEditingLinkIndex(null)
                  setLinkDraft({ label: "", url: "" })
                  setIsLinkComposerOpen(true)
                }}
              >
                <Plus className="size-4" />
                Adicionar link
              </Button>
            </div>

            {isLinkComposerOpen && (
              <div className="rounded-[12px] border border-border/70 bg-muted/30 p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-muted-foreground">Nome do link</label>
                    <Input
                      placeholder="Ex: Figma ou Produção"
                      value={linkDraft.label}
                      onChange={(e) => setLinkDraft((current) => ({ ...current, label: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-muted-foreground">URL</label>
                    <Input
                      placeholder="https://..."
                      value={linkDraft.url}
                      onChange={(e) => setLinkDraft((current) => ({ ...current, url: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="ghost" size="sm" className="h-8 rounded-full px-3" onClick={handleCancelLinkEdition}>
                    Cancelar
                  </Button>
                  <Button size="sm" className="h-8 rounded-full px-3" onClick={handleSaveLink} disabled={!linkDraft.label.trim() || !linkDraft.url.trim()}>
                    {editingLinkIndex === null ? "Salvar link" : "Atualizar link"}
                  </Button>
                </div>
              </div>
            )}

            {editLinks.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-border/60 bg-muted/15 px-4 py-5 text-sm text-muted-foreground">
                Nenhum link importante cadastrado ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {editLinks.map((link, index) => {
                  const kind = getLinkKind(link)
                  const config = LINK_KIND_STYLES[kind]
                  const Icon = config.icon
                  return (
                    <div
                      key={`${link.label}-${link.url}-${index}`}
                      className="group rounded-[12px] border border-border/70 bg-background/80 p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-card-hover"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", config.className)}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{link.label}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{getSimplifiedDomain(link.url)}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
                              <a href={normalizeLinkUrl(link.url)} target="_blank" rel="noopener noreferrer" className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                <ExternalLink className="size-4" />
                              </a>
                              <Button type="button" variant="ghost" size="sm" className="size-8 rounded-full p-0 text-muted-foreground hover:text-foreground" onClick={() => handleEditLink(index)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" className="size-8 rounded-full p-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveLink(index)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </DetailSection>

          <DetailSection title="Período">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Data de início</label>
                <Input type="date" value={editStartedAt} onChange={(e) => setEditStartedAt(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">Data de término</label>
                <Input type="date" value={editEndedAt} onChange={(e) => setEditEndedAt(e.target.value)} />
              </div>
            </div>
          </DetailSection>

          {showFreelancerFields && (
            <DetailSection title="Financeiro" description="Valor do projeto e histórico de pagamentos.">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Valor do projeto (R$)</label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Valor contratado do projeto. Salve as alterações para persistir.
                </p>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Histórico de pagamentos</p>
                  {!addingPayment && (
                    <Button size="sm" className="gap-1.5" onClick={() => setAddingPayment(true)}>
                      <Plus className="size-4" />
                      Registrar
                    </Button>
                  )}
                </div>

                {addingPayment && (
                  <div className="mb-3 rounded-[12px] border border-border/70 bg-muted/30 p-3">
                    <SegmentedControl aria-label="Tipo de lançamento" className="flex w-full">
                      {(["income", "expense"] as const).map((type) => (
                        <SegmentedControlItem
                          key={type}
                          active={paymentForm.type === type}
                          onClick={() => setPaymentForm((current) => ({ ...current, type }))}
                          className={cn(
                            "flex-1 justify-center",
                            paymentForm.type === type &&
                              (type === "income"
                                ? "bg-background text-success-foreground shadow-xs"
                                : "bg-background text-destructive shadow-xs")
                          )}
                        >
                          {type === "income" ? "Receita" : "Despesa"}
                        </SegmentedControlItem>
                      ))}
                    </SegmentedControl>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs text-muted-foreground">Data</label>
                        <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm((current) => ({ ...current, date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs text-muted-foreground">Valor (R$)</label>
                        <Input type="number" placeholder="0,00" value={paymentForm.amount} onChange={(e) => setPaymentForm((current) => ({ ...current, amount: e.target.value }))} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="mb-1.5 block text-xs text-muted-foreground">Nota (opcional)</label>
                      <Input placeholder="Ex: referente a maio/2026" value={paymentForm.notes} onChange={(e) => setPaymentForm((current) => ({ ...current, notes: e.target.value }))} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => setAddingPayment(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" className="flex-1 text-xs" onClick={handleRegisterPayment} disabled={!paymentForm.date || !paymentForm.amount}>
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}

                {project.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
                ) : (
                  <ul className="space-y-2">
                    {project.payments.map((payment) => (
                      <li key={payment.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 px-3 py-2">
                        <div className="min-w-0">
                          <span className="text-xs text-muted-foreground">
                            {formatPaymentDate(payment.date)}
                          </span>
                          {payment.notes && <p className="mt-1 text-xs text-muted-foreground">{payment.notes}</p>}
                        </div>
                        <span className={cn("text-sm font-medium tabular-nums", payment.type === "income" ? "text-success-foreground" : "text-destructive")}>
                          {payment.type === "expense" ? "−" : "+"}
                          {payment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </DetailSection>
          )}

          <DetailSection title="Observações">
            <Textarea
              placeholder="Anotações sobre o projeto..."
              value={editObs}
              onChange={(e) => setEditObs(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </DetailSection>
        </div>
      </div>
    </div>
  )
}

/**
 * `payment.date` é data-only (YYYY-MM-DD). `new Date("2026-06-28")` parseia como
 * meia-noite UTC e, em BRT, volta um dia — o pagamento aparecia na véspera. O
 * `T00:00:00` força hora local, que é a convenção das outras telas de data-only.
 */
function formatPaymentDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function ProjectDetailPage() {
  const params = useParams<{ workspace: string; projectId: string }>()
  const allProjects = useSyncExternalStore(subscribeProjectsStore, getProjectsSnapshot, getProjectsServerSnapshot)

  const workspaceParam = typeof params.workspace === "string" ? params.workspace : ""
  const projectIdParam = typeof params.projectId === "string" ? params.projectId : ""

  if (!isWorkspaceTab(workspaceParam)) {
    return (
      <Card className="border-border/70 py-0">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Workspace de projeto inválido.</p>
        </CardContent>
      </Card>
    )
  }

  const project = findProject(allProjects, workspaceParam, projectIdParam)

  if (!project) {
    return (
      <Card className="border-border/70 py-0">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Projeto não encontrado ou removido.</p>
        </CardContent>
      </Card>
    )
  }

  const projectRevisionKey = [
    project.updated_at,
    project.name,
    project.description,
    project.status,
    project.clientName,
    project.started_at,
    project.ended_at,
    project.observations,
    project.links.length,
    project.payments.length,
    project.timeline?.length ?? 0,
  ].join("|")

  return (
    <ProjectDetailSurface
      key={`${workspaceParam}-${projectIdParam}-${projectRevisionKey}`}
      workspace={workspaceParam}
      project={project}
    />
  )
}

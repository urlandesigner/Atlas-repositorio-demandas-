"use client"

import type React from "react"
import { useMemo, useState, useSyncExternalStore } from "react"
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  Flag,
  PauseCircle,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react"

import { useRecords } from "@/components/shell/records-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  addObjectiveToCollection,
  createObjectiveForm,
  createObjectiveFromForm,
  deleteObjectiveFromCollection,
  emitObjectivesChange,
  EMPTY_OBJECTIVE_FORM,
  getObjectivesServerSnapshot,
  getObjectivesSnapshot,
  OBJECTIVE_STATUS_LABEL,
  OBJECTIVE_STATUS_OPTIONS,
  PDI_DIMENSION_LABEL,
  PDI_DIMENSION_OPTIONS,
  saveObjectives,
  subscribeObjectivesStore,
  updateObjectiveInCollection,
  type ObjectiveEntry,
  type ObjectiveForm,
  type ObjectiveStatus,
  type PdiDimension,
} from "@/lib/objectives/store"
import type { RecordEntry } from "@/lib/records/types"
import { cn } from "@/lib/utils"

const STATUS_BADGE_CLASS: Record<ObjectiveStatus, string> = {
  planned: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  done: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paused: "border-muted-foreground/20 bg-muted text-muted-foreground",
}

const STATUS_ICON: Record<ObjectiveStatus, React.ElementType> = {
  planned: CircleDot,
  in_progress: Clock3,
  done: CheckCircle2,
  paused: PauseCircle,
}

const DIMENSION_CLASS: Record<PdiDimension, string> = {
  tecnologia: "border-blue-500/15 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  dominio: "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  pessoas: "border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  processos: "border-stone-500/15 bg-stone-500/10 text-stone-700 dark:text-stone-300",
  influencia: "border-violet-500/15 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  estudo: "border-orange-500/15 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  comunicacao: "border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  previsibilidade: "border-teal-500/15 bg-teal-500/10 text-teal-700 dark:text-teal-300",
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getDaysUntil(deadline: string | null) {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${deadline}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function getProgress(item: ObjectiveEntry) {
  if (item.status === "done") return 100
  const evidenceScore = Math.min(item.linkedRecordIds.length * 25, 75)
  const statusScore = item.status === "in_progress" ? 15 : item.status === "paused" ? 5 : 0
  return Math.min(evidenceScore + statusScore, 95)
}

function findLinkedRecords(records: RecordEntry[], objective: ObjectiveEntry) {
  const ids = new Set(objective.linkedRecordIds)
  return records.filter((record) => ids.has(record.id))
}

function toggleDimension(list: PdiDimension[], value: PdiDimension) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function toggleRecord(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function ObjectiveSheet({
  open,
  mode,
  initialForm,
  records,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  initialForm: ObjectiveForm
  records: RecordEntry[]
  onClose: () => void
  onSubmit: (form: ObjectiveForm) => void
}) {
  const [form, setForm] = useState<ObjectiveForm>(initialForm)

  function set<K extends keyof ObjectiveForm>(field: K, value: ObjectiveForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    setForm(initialForm)
    onClose()
  }

  function handleSubmit() {
    if (!form.title.trim()) return
    onSubmit(form)
    setForm(initialForm)
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && handleClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[38rem] sm:data-[side=right]:max-w-[38rem]" side="right">
        <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="text-base">
            {mode === "create" ? "Novo objetivo" : "Editar objetivo"}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Defina intenção, prazo e evidências esperadas para orientar seu ciclo profissional.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-5 px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Objetivo *</label>
              <Input
                placeholder="Ex: Fazer mais apresentações para o time de design"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Prazo</label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(event) => set("deadline", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => set("status", event.target.value as ObjectiveStatus)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                >
                  {OBJECTIVE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {OBJECTIVE_STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Dimensões PDI</label>
              <div className="flex flex-wrap gap-2">
                {PDI_DIMENSION_OPTIONS.map((dimension) => {
                  const selected = form.dimensions.includes(dimension)
                  return (
                    <Button
                      key={dimension}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => set("dimensions", toggleDimension(form.dimensions, dimension))}
                    >
                      {PDI_DIMENSION_LABEL[dimension]}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Motivação</label>
              <Textarea
                placeholder="Qual ponto do PDI esse objetivo fortalece?"
                value={form.motivation}
                onChange={(event) => set("motivation", event.target.value)}
                className="min-h-[92px] resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plano de ação</label>
              <Textarea
                placeholder="Quais passos concretos você pretende executar?"
                value={form.actionPlan}
                onChange={(event) => set("actionPlan", event.target.value)}
                className="min-h-[112px] resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Evidências esperadas</label>
              <Textarea
                placeholder="Que registros, materiais ou feedbacks comprovariam avanço?"
                value={form.expectedEvidence}
                onChange={(event) => set("expectedEvidence", event.target.value)}
                className="min-h-[92px] resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Registros vinculados
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {form.linkedRecordIds.length} selecionado(s)
                </span>
              </div>

              {records.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
                  Nenhum registro disponível ainda. Crie registros para transformar ações em evidências.
                </div>
              ) : (
                <div className="max-h-56 overflow-auto rounded-lg border bg-background">
                  {records.map((record) => {
                    const checked = form.linkedRecordIds.includes(record.id)
                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() =>
                          set("linkedRecordIds", toggleRecord(form.linkedRecordIds, record.id))
                        }
                        className={cn(
                          "flex w-full items-start gap-3 border-b px-3 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/50",
                          checked && "bg-muted/60"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                            checked && "border-primary bg-primary text-primary-foreground"
                          )}
                        >
                          {checked ? <CheckCircle2 className="size-3" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {record.enriched.title}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {record.enriched.impact || record.raw}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex flex-row gap-2 border-t px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!form.title.trim()}>
            {mode === "create" ? "Salvar objetivo" : "Salvar alterações"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ObjectiveCard({
  item,
  linkedRecordsCount,
  onClick,
}: {
  item: ObjectiveEntry
  linkedRecordsCount: number
  onClick: () => void
}) {
  const StatusIcon = STATUS_ICON[item.status]
  const daysUntil = getDaysUntil(item.deadline)
  const progress = getProgress(item)

  return (
    <Card
      className="h-full cursor-pointer hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_14px_28px_rgba(15,23,42,0.075)]"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.dimensions.slice(0, 3).map((dimension) => (
                <Badge
                  key={dimension}
                  variant="outline"
                  className={cn("font-normal", DIMENSION_CLASS[dimension])}
                >
                  {PDI_DIMENSION_LABEL[dimension]}
                </Badge>
              ))}
              {item.dimensions.length > 3 ? (
                <Badge variant="outline" className="font-normal">
                  +{item.dimensions.length - 3}
                </Badge>
              ) : null}
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0 font-normal", STATUS_BADGE_CLASS[item.status])}>
            <StatusIcon data-icon="inline-start" />
            {OBJECTIVE_STATUS_LABEL[item.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="line-clamp-3 text-xs text-muted-foreground">
          {item.motivation || "Sem motivação registrada."}
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Progresso estimado</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            <span className="truncate">
              {daysUntil === null
                ? "Sem prazo"
                : daysUntil < 0
                  ? `${Math.abs(daysUntil)}d atrasado`
                  : `${daysUntil}d restantes`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="size-3.5" />
            <span>{linkedRecordsCount} evidência(s)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-border/60 bg-muted/15 py-16">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Target className="size-5 text-muted-foreground" />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Nenhum objetivo registrado ainda.
        <br />
        Defina uma intenção para transformar o próximo ciclo em evidências.
      </p>
      <Button size="sm" onClick={onOpen}>
        <Plus data-icon="inline-start" />
        Novo objetivo
      </Button>
    </div>
  )
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </section>
  )
}

function ObjectiveDrawer({
  item,
  records,
  onEdit,
  onDelete,
  onClose,
}: {
  item: ObjectiveEntry | null
  records: RecordEntry[]
  onEdit: (item: ObjectiveEntry) => void
  onDelete: (item: ObjectiveEntry) => void
  onClose: () => void
}) {
  const linkedRecords = item ? findLinkedRecords(records, item) : []

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[38rem] sm:data-[side=right]:max-w-[38rem]" side="right">
        {item && (
          <>
            <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-base">{item.title}</SheetTitle>
                <Badge variant="outline" className={cn("font-normal", STATUS_BADGE_CLASS[item.status])}>
                  {OBJECTIVE_STATUS_LABEL[item.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(item.deadline) ? `Prazo: ${formatDate(item.deadline)}` : "Sem prazo definido"}
              </p>
            </SheetHeader>

            <ScrollArea className="flex-1 min-h-0">
              <div className="flex flex-col gap-5 px-5 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">Progresso</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">{getProgress(item)}%</p>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">Evidências</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">{linkedRecords.length}</p>
                  </div>
                </div>

                <DetailSection label="Dimensões PDI">
                  <div className="flex flex-wrap gap-1.5">
                    {item.dimensions.length ? (
                      item.dimensions.map((dimension) => (
                        <Badge
                          key={dimension}
                          variant="outline"
                          className={cn("font-normal", DIMENSION_CLASS[dimension])}
                        >
                          {PDI_DIMENSION_LABEL[dimension]}
                        </Badge>
                      ))
                    ) : (
                      "—"
                    )}
                  </div>
                </DetailSection>

                <Separator />

                <DetailSection label="Motivação">
                  <p>{item.motivation ?? "—"}</p>
                </DetailSection>

                <Separator />

                <DetailSection label="Plano de ação">
                  <p className="whitespace-pre-wrap">{item.actionPlan ?? "—"}</p>
                </DetailSection>

                <Separator />

                <DetailSection label="Evidências esperadas">
                  <p className="whitespace-pre-wrap">{item.expectedEvidence ?? "—"}</p>
                </DetailSection>

                <Separator />

                <DetailSection label="Registros vinculados">
                  {linkedRecords.length ? (
                    <div className="flex flex-col gap-2">
                      {linkedRecords.map((record) => (
                        <button
                          key={record.id}
                          type="button"
                          className="rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/50"
                        >
                          <p className="line-clamp-1 text-sm font-medium text-foreground">
                            {record.enriched.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {record.enriched.impact || record.raw}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p>Sem registros vinculados ainda.</p>
                  )}
                </DetailSection>
              </div>
            </ScrollArea>

            <div className="flex gap-2 border-t px-5 py-4">
              <Button variant="outline" className="flex-1" onClick={() => onEdit(item)}>
                <Pencil data-icon="inline-start" />
                Editar
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => onDelete(item)}>
                <Trash2 data-icon="inline-start" />
                Excluir
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function ObjectivesPage() {
  const { records } = useRecords()
  const [isAdding, setIsAdding] = useState(false)
  const [editing, setEditing] = useState<ObjectiveEntry | null>(null)
  const [selected, setSelected] = useState<ObjectiveEntry | null>(null)
  const objectives = useSyncExternalStore(
    subscribeObjectivesStore,
    getObjectivesSnapshot,
    getObjectivesServerSnapshot
  )

  const stats = useMemo(() => {
    const active = objectives.filter((item) => item.status === "in_progress").length
    const done = objectives.filter((item) => item.status === "done").length
    const evidence = objectives.reduce((total, item) => total + item.linkedRecordIds.length, 0)
    const dueSoon = objectives.filter((item) => {
      const days = getDaysUntil(item.deadline)
      return item.status !== "done" && days !== null && days >= 0 && days <= 30
    }).length
    return { active, done, evidence, dueSoon }
  }, [objectives])

  function handleAdd(form: ObjectiveForm) {
    const entry = createObjectiveFromForm(form)
    const next = addObjectiveToCollection(objectives, entry)
    saveObjectives(next)
    emitObjectivesChange()
    setIsAdding(false)
  }

  function handleEdit(form: ObjectiveForm) {
    if (!editing) return
    const next = updateObjectiveInCollection(objectives, editing.id, form)
    const updated = next.find((item) => item.id === editing.id) ?? null
    saveObjectives(next)
    emitObjectivesChange()
    setEditing(null)
    setSelected(updated)
  }

  function handleDelete(item: ObjectiveEntry) {
    const confirmed = window.confirm(`Excluir o objetivo "${item.title}"?`)
    if (!confirmed) return

    const next = deleteObjectiveFromCollection(objectives, item.id)
    saveObjectives(next)
    emitObjectivesChange()
    if (selected?.id === item.id) setSelected(null)
    if (editing?.id === item.id) setEditing(null)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Objetivos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Planeje ações do ciclo e conecte cada avanço a evidências reais.
            </p>
          </div>

          <Button size="sm" className="shrink-0" onClick={() => setIsAdding(true)}>
            <Plus data-icon="inline-start" />
            Novo objetivo
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Target className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{objectives.length}</p>
                <p className="text-xs text-muted-foreground">Objetivos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Clock3 className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Em andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{stats.evidence}</p>
                <p className="text-xs text-muted-foreground">Evidências</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Flag className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">{stats.dueSoon}</p>
                <p className="text-xs text-muted-foreground">Até 30 dias</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {objectives.length === 0 ? (
          <EmptyState onOpen={() => setIsAdding(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {objectives.map((item) => (
              <ObjectiveCard
                key={item.id}
                item={item}
                linkedRecordsCount={findLinkedRecords(records, item).length}
                onClick={() => setSelected(item)}
              />
            ))}
          </div>
        )}
      </div>

      <ObjectiveSheet
        key={`create-${isAdding ? "open" : "closed"}`}
        open={isAdding}
        mode="create"
        initialForm={EMPTY_OBJECTIVE_FORM}
        records={records}
        onClose={() => setIsAdding(false)}
        onSubmit={handleAdd}
      />
      <ObjectiveSheet
        key={`edit-${editing?.id ?? "closed"}`}
        open={!!editing}
        mode="edit"
        initialForm={editing ? createObjectiveForm(editing) : EMPTY_OBJECTIVE_FORM}
        records={records}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
      <ObjectiveDrawer
        item={selected}
        records={records}
        onEdit={(item) => {
          setSelected(null)
          setEditing(item)
        }}
        onDelete={handleDelete}
        onClose={() => setSelected(null)}
      />
    </>
  )
}

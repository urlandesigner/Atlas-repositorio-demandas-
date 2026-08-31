"use client"

import { useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/ui/status-badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PRESENTATION_STATUS_TONE } from "@/lib/status-tone"
import { CalendarDays, ExternalLink, Pencil, Plus, Presentation, Trash2, UsersRound } from "lucide-react"
import { EvolutionShell } from "@/components/evolution/evolution-shell"
import {
  addPresentationToCollection,
  createPresentationForm,
  createPresentationFromForm,
  deletePresentationFromCollection,
  emitPresentationsChange,
  EMPTY_PRESENTATION_FORM,
  getPresentationsServerSnapshot,
  getPresentationsSnapshot,
  savePresentations,
  subscribePresentationsStore,
  updatePresentationInCollection,
  type PresentationEntry,
  type PresentationForm,
  type PresentationStatus,
} from "@/lib/presentations/store"

const STATUS_LABEL: Record<PresentationStatus, string> = {
  done: "Realizado",
  scheduled: "Agendado",
  not_done: "Não realizado",
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function PresentationSheet({
  open,
  mode,
  initialForm,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  initialForm: PresentationForm
  onClose: () => void
  onSubmit: (form: PresentationForm) => void
}) {
  const [form, setForm] = useState<PresentationForm>(initialForm)

  function set(field: keyof PresentationForm, value: PresentationForm[keyof PresentationForm]) {
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
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[34rem] sm:data-[side=right]:max-w-[34rem]" side="right">
        <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="text-base">{mode === "create" ? "Nova apresentação" : "Editar apresentação"}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Registre materiais compartilhados com descrição, público, data e link de acesso.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <Input placeholder="Ex: AI First Design" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <Textarea
                placeholder="Sobre o conteúdo apresentado..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Compartilhado com</label>
              <Input placeholder="Ex: Time de produto e design" value={form.sharedWith} onChange={(e) => set("sharedWith", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={form.status}
                onValueChange={(value) => set("status", value as PresentationStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: PresentationStatus) => STATUS_LABEL[value]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="done">Realizado</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="not_done">Não realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Link</label>
              <Input placeholder="https://..." value={form.link} onChange={(e) => set("link", e.target.value)} />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex flex-row gap-2 border-t px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!form.title.trim()}>
            {mode === "create" ? "Salvar apresentação" : "Salvar alterações"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function PresentationCard({
  item,
  onClick,
}: {
  item: PresentationEntry
  onClick: () => void
}) {
  const dateLabel = formatDate(item.date)
  const hasMeta = Boolean(item.sharedWith || dateLabel || item.link)
  const hasAnyDetail = Boolean(item.description) || hasMeta

  return (
    <Card
      className="h-full cursor-pointer hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-card-hover"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-snug">{item.title}</h3>
          <StatusBadge tone={PRESENTATION_STATUS_TONE[item.status]} className="shrink-0 text-xs font-normal">
            {STATUS_LABEL[item.status]}
          </StatusBadge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {item.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        ) : null}

        {hasMeta ? (
          <div className="space-y-2 text-xs text-muted-foreground">
            {item.sharedWith ? (
              <div className="flex items-center gap-2">
                <UsersRound className="size-3.5" />
                <span className="truncate">{item.sharedWith}</span>
              </div>
            ) : null}
            {dateLabel ? (
              <div className="flex items-center gap-2">
                <CalendarDays className="size-3.5" />
                <span>{dateLabel}</span>
              </div>
            ) : null}
            {item.link ? (
              <div className="flex items-center gap-2">
                <ExternalLink className="size-3.5" />
                <span className="truncate">{item.link}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {!hasAnyDetail ? (
          <p className="text-xs text-muted-foreground/60">Sem detalhes adicionais</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <EmptyStateCard
      size="page"
      icon={Presentation}
      title="Nenhuma apresentação registrada ainda"
      description="Adicione materiais que você compartilhou com o time."
      action={
        <Button size="sm" className="gap-1.5" onClick={onOpen}>
          <Plus className="size-4" />
          Nova apresentação
        </Button>
      }
    />
  )
}

function PresentationDrawer({
  item,
  onEdit,
  onDelete,
  onClose,
}: {
  item: PresentationEntry | null
  onEdit: (item: PresentationEntry) => void
  onDelete: (item: PresentationEntry) => void
  onClose: () => void
}) {
  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[34rem] sm:data-[side=right]:max-w-[34rem]" side="right">
        {item && (
          <>
            <SheetHeader className="px-5 pt-5 pb-4 border-b pr-12">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-base">{item.title}</SheetTitle>
                <StatusBadge tone={PRESENTATION_STATUS_TONE[item.status]} className="font-normal">
                  {STATUS_LABEL[item.status]}
                </StatusBadge>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 min-h-0">
              <div className="flex flex-col gap-5 px-5 py-5">
                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Descrição</p>
                  <p className="text-sm text-muted-foreground">{item.description ?? "—"}</p>
                </section>

                <Separator />

                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Compartilhado com
                  </p>
                  <p className="text-sm text-muted-foreground">{item.sharedWith ?? "—"}</p>
                </section>

                <Separator />

                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Data</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(item.date) ?? "—"}
                  </p>
                </section>

                <Separator />

                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Status</p>
                  <StatusBadge tone={PRESENTATION_STATUS_TONE[item.status]} className="font-normal">
                    {STATUS_LABEL[item.status]}
                  </StatusBadge>
                </section>

                <Separator />

                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Link</p>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-accent-ink hover:underline"
                    >
                      <ExternalLink className="size-4" />
                      Abrir material
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </section>
              </div>
            </ScrollArea>

            <div className="flex gap-2 border-t px-5 py-4">
              <Button variant="outline" className="flex-1 gap-1.5" onClick={() => onEdit(item)}>
                <Pencil className="size-4" />
                Editar
              </Button>
              <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => onDelete(item)}>
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function PresentationsPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [editing, setEditing] = useState<PresentationEntry | null>(null)
  const [selected, setSelected] = useState<PresentationEntry | null>(null)
  const presentations = useSyncExternalStore(
    subscribePresentationsStore,
    getPresentationsSnapshot,
    getPresentationsServerSnapshot
  )

  function handleAdd(form: PresentationForm) {
    const entry = createPresentationFromForm(form)
    const next = addPresentationToCollection(presentations, entry)
    savePresentations(next)
    emitPresentationsChange()
    setIsAdding(false)
  }

  function handleEdit(form: PresentationForm) {
    if (!editing) return
    const next = updatePresentationInCollection(presentations, editing.id, form)
    const updated = next.find((item) => item.id === editing.id) ?? null
    savePresentations(next)
    emitPresentationsChange()
    setEditing(null)
    setSelected(updated)
  }

  function handleDelete(item: PresentationEntry) {
    const confirmed = window.confirm(`Excluir a apresentação "${item.title}"?`)
    if (!confirmed) return

    const next = deletePresentationFromCollection(presentations, item.id)
    savePresentations(next)
    emitPresentationsChange()

    if (selected?.id === item.id) setSelected(null)
    if (editing?.id === item.id) setEditing(null)
  }

  return (
    <>
      <EvolutionShell
        title="Conhecimento compartilhado"
        description="Apresentações e materiais que você compartilhou com o time."
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setIsAdding(true)}>
              <Plus className="size-4" />
              Nova apresentação
            </Button>
          </div>

          {presentations.length === 0 ? (
            <EmptyState onOpen={() => setIsAdding(true)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {presentations.map((item) => (
                <PresentationCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelected(item)}
                />
              ))}
            </div>
          )}
        </div>
      </EvolutionShell>

      <PresentationSheet
        key={`create-${isAdding ? "open" : "closed"}`}
        open={isAdding}
        mode="create"
        initialForm={EMPTY_PRESENTATION_FORM}
        onClose={() => setIsAdding(false)}
        onSubmit={handleAdd}
      />
      <PresentationSheet
        key={`edit-${editing?.id ?? "closed"}`}
        open={!!editing}
        mode="edit"
        initialForm={editing ? createPresentationForm(editing) : EMPTY_PRESENTATION_FORM}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
      <PresentationDrawer
        item={selected}
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

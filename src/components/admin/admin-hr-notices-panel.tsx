"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { Megaphone, Pencil, Pin, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { HrNoticeCard } from "@/components/hr/hr-notice-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRow,
  CardListRowMeta,
  CardListRows,
  CardListRowTitle,
} from "@/components/ui/card-list"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { logAudit } from "@/lib/gestao/audit/store"
import {
  createHrNotice,
  deleteHrNotice,
  getHrNoticesServerSnapshot,
  getHrNoticesSnapshot,
  subscribeHrNoticesStore,
  updateHrNotice,
  type HrNotice,
} from "@/lib/hr/store"

const CATEGORY_OPTIONS: HrNotice["category"][] = ["Comunicados", "Processos", "Benefícios"]
const AUDIENCE_OPTIONS: Array<{ value: HrNotice["audience"]; label: string }> = [
  { value: "all", label: "Toda a área" },
  { value: "colaborador", label: "Só colaboradores" },
  { value: "gestor", label: "Só gestores" },
  { value: "admin", label: "Só admins" },
]

function formatNoticeDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function toDateInputValue(value: string) {
  return value.slice(0, 10)
}

function AdminMetric({
  label,
  value,
  helper,
}: {
  label: string
  value: number
  helper: string
}) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card/65 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

export function AdminHrNoticesPanel() {
  const { session } = useAuth()
  const noticesData = useSyncExternalStore(
    subscribeHrNoticesStore,
    getHrNoticesSnapshot,
    getHrNoticesServerSnapshot
  )

  const areaNotices = useMemo(() => {
    return noticesData
      .filter((notice) => notice.areaId === (session?.areaId ?? null))
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
        return b.publishedAt.localeCompare(a.publishedAt)
      })
  }, [noticesData, session?.areaId])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<HrNotice | null>(null)
  const [deleting, setDeleting] = useState<HrNotice | null>(null)

  const pinnedCount = areaNotices.filter((notice) => notice.pinned).length
  const roleScopedCount = areaNotices.filter((notice) => notice.audience !== "all").length

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Avisos do RH</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre comunicados que devem aparecer na home dos colaboradores e gestores da área.
            </p>
          </div>
          <PageHeaderActions>
            <Button
              onClick={() => {
                setEditing(null)
                setSheetOpen(true)
              }}
            >
              <Plus data-icon="inline-start" />
              Novo aviso
            </Button>
          </PageHeaderActions>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <AdminMetric label="Avisos ativos" value={areaNotices.length} helper="Comunicados visíveis na área" />
          <AdminMetric label="Em destaque" value={pinnedCount} helper="Fixados no topo da leitura" />
          <AdminMetric label="Segmentados" value={roleScopedCount} helper="Direcionados por público" />
        </div>

        <CardList>
          <CardListHeader
            title="Lista de avisos"
            description="Tudo o que já está publicado para o RH comunicar no workspace."
            action={<Badge variant="outline">{areaNotices.length}</Badge>}
          />
          <CardListBody>
            {areaNotices.length ? (
              <CardListRows>
                {areaNotices.map((notice) => (
                  <CardListRow key={notice.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardListRowTitle>{notice.title}</CardListRowTitle>
                        {notice.pinned ? <Badge variant="secondary">Destaque</Badge> : null}
                        <Badge variant="outline">{notice.category}</Badge>
                        <Badge variant="outline">
                          {AUDIENCE_OPTIONS.find((option) => option.value === notice.audience)?.label}
                        </Badge>
                      </div>
                      <CardListRowMeta>{notice.body}</CardListRowMeta>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Publicado em {formatNoticeDate(notice.publishedAt)}
                        {notice.ctaLabel ? ` · CTA: ${notice.ctaLabel}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(notice)
                          setSheetOpen(true)
                        }}
                      >
                        <Pencil className="size-3.5" data-icon="inline-start" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(notice)}
                      >
                        <Trash2 className="size-3.5" data-icon="inline-start" />
                        Excluir
                      </Button>
                    </div>
                  </CardListRow>
                ))}
              </CardListRows>
            ) : (
              <div className="px-4 py-4">
                <EmptyStateCard
                  title="Nenhum aviso cadastrado ainda"
                  description="Crie o primeiro comunicado do RH para aparecer na home da área."
                />
              </div>
            )}
          </CardListBody>
        </CardList>
      </div>

      <HrNoticeFormSheet
        key={editing?.id ?? (sheetOpen ? "new-notice" : "notice-closed")}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir aviso do RH?</DialogTitle>
            <DialogDescription>
              Esse comunicado deixará de aparecer imediatamente para as pessoas da área.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting || !session?.areaId) return
                deleteHrNotice(deleting.id)
                logAudit({
                  areaId: session.areaId,
                  actorId: session.userId,
                  action: "hr_notice.deleted",
                  entityType: "hr_notice",
                  entityId: deleting.id,
                  summary: `Aviso do RH "${deleting.title}" removido.`,
                })
                setDeleting(null)
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function HrNoticeFormSheet({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: HrNotice | null
}) {
  const { session } = useAuth()
  const [title, setTitle] = useState(editing?.title ?? "")
  const [body, setBody] = useState(editing?.body ?? "")
  const [category, setCategory] = useState<HrNotice["category"]>(editing?.category ?? "Comunicados")
  const [audience, setAudience] = useState<HrNotice["audience"]>(editing?.audience ?? "all")
  const [publishedAt, setPublishedAt] = useState(
    editing?.publishedAt ? toDateInputValue(editing.publishedAt) : toDateInputValue(new Date().toISOString())
  )
  const [ctaLabel, setCtaLabel] = useState(editing?.ctaLabel ?? "")
  const [ctaHref, setCtaHref] = useState(editing?.ctaHref ?? "")
  const [pinned, setPinned] = useState(Boolean(editing?.pinned))
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!session?.areaId) {
      setError("Sessão inválida.")
      return
    }

    if (!title.trim() || !body.trim() || !publishedAt) {
      setError("Preencha título, conteúdo e data de publicação.")
      return
    }

    if ((ctaLabel.trim() && !ctaHref.trim()) || (!ctaLabel.trim() && ctaHref.trim())) {
      setError("Preencha CTA e link juntos, ou deixe os dois em branco.")
      return
    }

    const payload = {
      areaId: session.areaId,
      title: title.trim(),
      body: body.trim(),
      category,
      audience,
      ctaLabel: ctaLabel.trim() || null,
      ctaHref: ctaHref.trim() || null,
      pinned,
      publishedAt: `${publishedAt}T09:00:00.000Z`,
    }

    try {
      if (editing) {
        const updated = updateHrNotice(editing.id, payload)
        logAudit({
          areaId: session.areaId,
          actorId: session.userId,
          action: "hr_notice.updated",
          entityType: "hr_notice",
          entityId: updated.id,
          summary: `Aviso do RH "${updated.title}" atualizado.`,
        })
      } else {
        const created = createHrNotice(payload)
        logAudit({
          areaId: session.areaId,
          actorId: session.userId,
          action: "hr_notice.created",
          entityType: "hr_notice",
          entityId: created.id,
          summary: `Aviso do RH "${created.title}" criado.`,
        })
      }

      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o aviso.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{editing ? "Editar aviso do RH" : "Novo aviso do RH"}</SheetTitle>
          <SheetDescription>
            Esse conteúdo será exibido na home da área de acordo com o público escolhido.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Título</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Recado</span>
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Categoria</span>
              <Select value={category} onValueChange={(value) => value && setCategory(value as HrNotice["category"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Público</span>
              <Select value={audience} onValueChange={(value) => value && setAudience(value as HrNotice["audience"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Publicação</span>
              <Input
                type="date"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Texto do CTA</span>
              <Input
                value={ctaLabel}
                onChange={(event) => setCtaLabel(event.target.value)}
                placeholder="Ex.: Abrir perfil"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Link do CTA</span>
              <Input
                value={ctaHref}
                onChange={(event) => setCtaHref(event.target.value)}
                placeholder="/professional/profile"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-[12px] border border-border/70 bg-card px-3 py-3">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
              className="size-4 rounded border-border"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">Fixar em destaque</p>
              <p className="text-xs text-muted-foreground">
                Avisos destacados aparecem primeiro na leitura da home.
              </p>
            </div>
            <Pin className="ml-auto size-4 text-muted-foreground" />
          </label>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm font-medium">Preview na home</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <HrNoticeCard
                preview
                isUnread
                notice={{
                  id: editing?.id ?? "preview",
                  areaId: session?.areaId ?? null,
                  title: title.trim() || "Título do aviso",
                  body: body.trim() || "O texto do recado do RH aparecerá aqui para leitura rápida.",
                  category,
                  audience,
                  ctaLabel: ctaLabel.trim() || null,
                  ctaHref: ctaHref.trim() || null,
                  publishedAt: `${publishedAt || toDateInputValue(new Date().toISOString())}T09:00:00.000Z`,
                  pinned,
                }}
              />
            </CardContent>
          </Card>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Megaphone data-icon="inline-start" />
            {editing ? "Salvar aviso" : "Publicar aviso"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

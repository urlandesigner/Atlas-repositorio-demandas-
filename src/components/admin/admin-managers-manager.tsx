"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRow,
  CardListRowMeta,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  createOrgUser,
  deleteOrgUser,
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
  updateOrgUser,
} from "@/lib/org/store"
import type { OrgUser } from "@/lib/org/types"

export function AdminManagersManager() {
  const { session } = useAuth()
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const areaId = session?.areaId ?? null
  const managers = useMemo(
    () => (areaId ? org.users.filter((user) => user.areaId === areaId && user.role === "gestor") : []),
    [areaId, org.users]
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<OrgUser | null>(null)
  const [deleting, setDeleting] = useState<OrgUser | null>(null)

  const reportsByManagerId = useMemo(() => {
    const map = new Map<string, number>()
    org.users.forEach((user) => {
      if (!user.managerId) return
      map.set(user.managerId, (map.get(user.managerId) ?? 0) + 1)
    })
    return map
  }, [org.users])

  const managersWithTeam = useMemo(
    () => managers.filter((manager) => (reportsByManagerId.get(manager.id) ?? 0) > 0).length,
    [managers, reportsByManagerId]
  )

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(user: OrgUser) {
    setEditing(user)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestores da área</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pessoas responsáveis por liderar times e operar o fluxo de acompanhamento da área.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Novo gestor
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <AdminMetric label="Gestores ativos" value={managers.length} helper="Cadastros disponíveis para atuação" />
        <AdminMetric label="Com time vinculado" value={managersWithTeam} helper="Já responsáveis por pessoas da área" />
        <AdminMetric label="Sem time ainda" value={Math.max(managers.length - managersWithTeam, 0)} helper="Podem receber novos vínculos" />
      </div>

      <CardList>
        <CardListHeader
          title="Lista de gestores"
          description="Quem lidera o time e como a carga está distribuída."
          action={<Badge variant="outline">{managers.length}</Badge>}
        />
        <CardListBody className="divide-y divide-border/60">
          {managers.map((user) => (
            <CardListRow key={user.id}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardListRowTitle>{user.name}</CardListRowTitle>
                  <Badge variant="secondary">{user.managementTitle ?? "Gestão"}</Badge>
                  <Badge variant="outline">
                    {reportsByManagerId.get(user.id) ?? 0} pessoa(s) no time
                  </Badge>
                </div>
                <CardListRowMeta>{user.email}</CardListRowMeta>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                  <Pencil className="size-3.5" data-icon="inline-start" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleting(user)}
                >
                  <Trash2 className="size-3.5" data-icon="inline-start" />
                  Excluir
                </Button>
              </div>
            </CardListRow>
          ))}
          {!managers.length ? (
            <div className="px-4 py-4">
              <EmptyStateCard
                title="Nenhum gestor cadastrado ainda"
                description="Crie o primeiro gestor para distribuir pessoas e organizar o acompanhamento."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus data-icon="inline-start" />
                    Novo gestor
                  </Button>
                }
              />
            </div>
          ) : null}
        </CardListBody>
      </CardList>

      <ManagerFormSheet
        key={editing?.id ?? (sheetOpen ? "new-manager" : "manager-closed")}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        areaId={session?.areaId ?? null}
        adminId={session?.userId ?? null}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir gestor?</DialogTitle>
            <DialogDescription>
              Colaboradores vinculados a este gestor permanecerão no cadastro, mas sem gestor
              imediato definido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleting) {
                  deleteOrgUser(deleting.id)
                  setDeleting(null)
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
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

function ManagerFormSheet({
  open,
  onOpenChange,
  editing,
  areaId,
  adminId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: OrgUser | null
  areaId: string | null
  adminId: string | null
}) {
  const [name, setName] = useState(editing?.name ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [managementTitle, setManagementTitle] = useState(editing?.managementTitle ?? "")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !managementTitle.trim()) {
      setError("Preencha nome, email e cargo de gestão.")
      return
    }
    if (!areaId || !adminId) {
      setError("Sessão inválida.")
      return
    }

    try {
      if (editing) {
        updateOrgUser(editing.id, {
          name: name.trim(),
          email: email.trim(),
          managementTitle: managementTitle.trim(),
          kind: "gestao",
          role: "gestor",
        })
      } else {
        createOrgUser({
          name: name.trim(),
          email: email.trim(),
          role: "gestor",
          areaId,
          kind: "gestao",
          managementTitle: managementTitle.trim(),
          managerId: adminId,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editing ? "Editar gestor" : "Novo gestor"}</SheetTitle>
          <SheetDescription>
            Gestores cadastrados podem acessar o painel de gestão e liderar colaboradores.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4 pt-0">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nome</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Cargo de gestão</span>
            <Input
              value={managementTitle}
              onChange={(event) => setManagementTitle(event.target.value)}
              placeholder="Head, Coordenador, Supervisor…"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

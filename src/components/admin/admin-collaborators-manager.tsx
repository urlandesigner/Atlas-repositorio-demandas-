"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowUpRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRow,
  CardListRowMeta,
  CardListRowTitle,
} from "@/components/ui/card-list"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { Field } from "@/components/ui/field"
import { MetricCard } from "@/components/ui/metric-card"
import { PersonAvatar } from "@/components/ui/person-avatar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

export function AdminCollaboratorsManager() {
  const { session } = useAuth()
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const areaId = session?.areaId ?? null
  const managers = useMemo(
    () => (areaId ? org.users.filter((user) => user.areaId === areaId && user.role === "gestor") : []),
    [areaId, org.users]
  )
  const collaborators = useMemo(
    () =>
      areaId
        ? org.users.filter((user) => user.areaId === areaId && user.role === "colaborador")
        : [],
    [areaId, org.users]
  )

  const managerName = useMemo(() => {
    const map = new Map<string, string>()
    managers.forEach((manager) => map.set(manager.id, manager.name))
    return map
  }, [managers])

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<OrgUser | null>(null)
  const [deleting, setDeleting] = useState<OrgUser | null>(null)

  const withoutManager = useMemo(
    () => collaborators.filter((user) => !user.managerId || !managerName.has(user.managerId)).length,
    [collaborators, managerName]
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
      <PageHeader
        title="Colaboradores da área"
        description="Pessoas da área vinculadas a um gestor, prontas para acompanhamento e PDI."
      >
        <PageHeaderActions>
          <Button size="sm" onClick={openCreate} disabled={!managers.length}>
            <Plus data-icon="inline-start" />
            Novo colaborador
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Pessoas cadastradas" value={collaborators.length} helper="Base atual da área" />
        <MetricCard label="Gestores disponíveis" value={managers.length} helper="Responsáveis possíveis para vínculo" />
        <MetricCard label="Sem gestor" value={withoutManager} helper="Precisam de vínculo para acompanhamento" />
      </div>

      {!managers.length ? (
        <Card>
          <CardContent>
            <EmptyStateCard
              title="Cadastre um gestor antes de criar colaboradores"
              description="Cada pessoa precisa de um gestor para PDI e acompanhamento."
              action={
                <Link
                  href="/admin/gestores"
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  Ir para gestores
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <CardList>
          <CardListHeader
            title="Lista de colaboradores"
            description="Base da área com gestor e acesso à ficha."
            action={<Badge variant="outline">{collaborators.length}</Badge>}
          />
          <CardListBody className="divide-y divide-border/60">
            {collaborators.map((user) => (
              <CardListRow key={user.id}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <PersonAvatar name={user.name} imageUrl={user.avatarUrl} />
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardListRowTitle>{user.name}</CardListRowTitle>
                    <Badge variant="outline">
                      {user.managerId && managerName.has(user.managerId)
                        ? managerName.get(user.managerId)
                        : "Sem gestor"}
                    </Badge>
                  </div>
                  <CardListRowMeta>{user.email}</CardListRowMeta>
                </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Link
                    href={`/gestao/liderados/${user.id}`}
                    className={buttonVariants({ variant: "default", size: "sm" })}
                  >
                    Abrir ficha
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                    <Pencil className="size-3.5" data-icon="inline-start" />
                    Editar
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" aria-label="Mais ações" />}
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleting(user)}>
                        <Trash2 className="size-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardListRow>
            ))}
            {!collaborators.length ? (
              <div className="px-4 py-4">
                <EmptyStateCard
                  title="Nenhum colaborador cadastrado ainda"
                  description="Cadastre a primeira pessoa para vincular gestores e iniciar os ciclos."
                  action={
                    <Button size="sm" onClick={openCreate}>
                      <Plus data-icon="inline-start" />
                      Novo colaborador
                    </Button>
                  }
                />
              </div>
            ) : null}
          </CardListBody>
        </CardList>
      )}

      <CollaboratorFormSheet
        key={editing?.id ?? (sheetOpen ? "new-collaborator" : "collaborator-closed")}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        areaId={session?.areaId ?? null}
        managers={managers}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir colaborador?</DialogTitle>
            <DialogDescription>
              Esta ação remove o colaborador do cadastro da área. Não pode ser desfeita.
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

function CollaboratorFormSheet({
  open,
  onOpenChange,
  editing,
  areaId,
  managers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: OrgUser | null
  areaId: string | null
  managers: OrgUser[]
}) {
  const [name, setName] = useState(editing?.name ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [managerId, setManagerId] = useState(
    editing?.managerId ?? (managers.length === 1 ? managers[0].id : "")
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !managerId) {
      setError("Preencha nome, email e gestor.")
      return
    }
    if (!areaId) {
      setError("Sessão inválida.")
      return
    }

    try {
      if (editing) {
        updateOrgUser(editing.id, {
          name: name.trim(),
          email: email.trim(),
          managerId,
          kind: "colaborador",
          role: "colaborador",
        })
      } else {
        createOrgUser({
          name: name.trim(),
          email: email.trim(),
          role: "colaborador",
          areaId,
          kind: "colaborador",
          managementTitle: null,
          managerId,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full" size="md">
        <SheetHeader>
          <SheetTitle>{editing ? "Editar colaborador" : "Novo colaborador"}</SheetTitle>
          <SheetDescription>
            O colaborador fica vinculado a um gestor da área.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4 pt-0">
          <Field label="Nome">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Gestor">
            <Select value={managerId} onValueChange={(value) => value && setManagerId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o gestor">
                  {(value: string) =>
                    managers.find((manager) => manager.id === value)?.name ?? value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                    {manager.managementTitle ? ` · ${manager.managementTitle}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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

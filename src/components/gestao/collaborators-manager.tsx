"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { CollaboratorFormSheet } from "@/components/gestao/collaborator-form-sheet"
import { DiscProfileBadges } from "@/components/gestao/disc-profile-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeaderActions } from "@/components/shell/page-header-actions"
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
import { PersonAvatar } from "@/components/ui/person-avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { logAudit } from "@/lib/gestao/audit/store"
import {
  getBehavioralProfile,
  getGestaoProfilesServerSnapshot,
  getGestaoProfilesSnapshot,
  subscribeGestaoProfilesStore,
} from "@/lib/gestao/profiles-store"
import { deleteProfilesForUser } from "@/lib/gestao/profiles-store"
import {
  createOrgUser,
  deleteOrgUser,
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
  updateOrgUser,
} from "@/lib/org/store"
import type { CollaboratorKind, OrgUser } from "@/lib/org/types"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function useDirectReports(managerId: string | undefined) {
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  return useMemo(() => {
    if (!managerId) return []
    return org.users.filter((user) => user.managerId === managerId)
  }, [managerId, org.users])
}

export function CollaboratorsManager({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { session } = useAuth()
  const profiles = useSyncExternalStore(
    subscribeGestaoProfilesStore,
    getGestaoProfilesSnapshot,
    getGestaoProfilesServerSnapshot
  )
  const directReports = useDirectReports(session?.userId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<OrgUser | null>(null)
  const [deleting, setDeleting] = useState<OrgUser | null>(null)

  const behavioralByUserId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getBehavioralProfile>>()
    directReports.forEach((user) => {
      const stored =
        profiles.behavioral.find((entry) => entry.userId === user.id) ?? getBehavioralProfile(user.id)
      map.set(user.id, stored)
    })
    return map
  }, [directReports, profiles.behavioral])

  const summary = useMemo(() => {
    const withDisc = directReports.filter((user) => {
      const behavioral = behavioralByUserId.get(user.id)
      return Boolean(behavioral?.discProfiles.length)
    }).length

    return {
      total: directReports.length,
      gestao: directReports.filter((user) => user.kind === "gestao" || user.role === "gestor").length,
      withDisc,
    }
  }, [behavioralByUserId, directReports])

  function handleSubmit(data: {
    name: string
    email: string
    kind: CollaboratorKind
    managementTitle: string | null
  }) {
    if (!session) return

    if (editing) {
      const isLeader = editing.role === "gestor" || editing.role === "admin"
      const updated = updateOrgUser(editing.id, {
        name: data.name,
        email: data.email,
        // Papel de liderança (role) só muda em Administração; aqui ajustamos o tipo do liderado.
        ...(isLeader ? {} : { kind: data.kind, managementTitle: data.managementTitle }),
      })
      if (session.areaId) {
        logAudit({
          areaId: session.areaId,
          actorId: session.userId,
          action: "user.updated",
          entityType: "user",
          entityId: updated.id,
          summary: `Colaborador ${updated.name} atualizado.`,
        })
      }
      return
    }

    const created = createOrgUser({
      name: data.name,
      email: data.email,
      role: "colaborador",
      areaId: session.areaId,
      kind: data.kind,
      managementTitle: data.managementTitle,
      managerId: session.userId,
    })
    if (session.areaId) {
      logAudit({
        areaId: session.areaId,
        actorId: session.userId,
        action: "user.created",
        entityType: "user",
        entityId: created.id,
        summary: `Colaborador ${created.name} cadastrado.`,
      })
    }
  }

  function confirmDelete() {
    if (!deleting) return
    const removed = deleting
    deleteProfilesForUser(removed.id)
    deleteOrgUser(removed.id)
    if (session?.areaId) {
      logAudit({
        areaId: session.areaId,
        actorId: session.userId,
        action: "user.deleted",
        entityType: "user",
        entityId: removed.id,
        summary: `Colaborador ${removed.name} removido.`,
      })
    }
    setDeleting(null)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <PageHeaderActions>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setSheetOpen(true)
              }}
            >
              <Plus data-icon="inline-start" />
              Novo colaborador
            </Button>
          </PageHeaderActions>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryMetric label="Pessoas no time" value={summary.total} />
          <SummaryMetric label="Com perfil definido" value={summary.withDisc} />
          <SummaryMetric label="Em gestão ou coordenação" value={summary.gestao} />
        </div>

        <CardList>
          <CardListHeader
            title="Base do time"
            description="Acesso rápido à ficha e ao acompanhamento."
            action={<Badge variant="outline">{directReports.length}</Badge>}
          />
          <CardListBody>
            {directReports.length ? (
              <CardListRows>
                {directReports.map((user) => {
                  const behavioral = behavioralByUserId.get(user.id)
                  const roleLabel =
                    user.role === "gestor"
                      ? "Gestor"
                      : user.role === "admin"
                        ? "Admin"
                        : user.kind === "gestao"
                          ? "Gestão / Coordenação"
                          : "Colaborador"

                  return (
                    <CardListRow key={user.id}>
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <PersonAvatar name={user.name} imageUrl={user.avatarUrl} />
                        <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardListRowTitle>{user.name}</CardListRowTitle>
                          <Badge variant="outline">{roleLabel}</Badge>
                          {user.managementTitle ? (
                            <Badge variant="secondary">{user.managementTitle}</Badge>
                          ) : null}
                        </div>
                        <CardListRowMeta>{user.email}</CardListRowMeta>
                        <div className="mt-3">
                          <DiscProfileBadges profiles={behavioral?.discProfiles ?? []} />
                        </div>
                      </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <Link
                          href={`/gestao/liderados/${user.id}`}
                          className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1")}
                        >
                          Abrir ficha
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditing(user)
                          setSheetOpen(true)
                        }}>
                          <Pencil className="size-3.5" data-icon="inline-start" />
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(user)}>
                          <Trash2 className="size-3.5" data-icon="inline-start" />
                          Excluir
                        </Button>
                      </div>
                    </CardListRow>
                  )
                })}
              </CardListRows>
            ) : (
              <div className="px-4 py-4">
                <EmptyStateCard
                  title="Nenhuma pessoa cadastrada no seu time ainda"
                  description="Adicione as primeiras pessoas para começar PDI e acompanhamento."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(null)
                        setSheetOpen(true)
                      }}
                    >
                      <Plus data-icon="inline-start" />
                      Novo colaborador
                    </Button>
                  }
                />
              </div>
            )}
          </CardListBody>
        </CardList>
      </div>

      <CollaboratorFormSheet
        key={editing?.id ?? (sheetOpen ? "new-team-member" : "team-member-closed")}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSubmit={handleSubmit}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir pessoa do time</DialogTitle>
            <DialogDescription>
              Remover {deleting?.name}? O perfil comportamental e o radar de competências também
              serão apagados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card/65 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react"

import { DiscProfileBadges } from "@/components/gestao/disc-profile-picker"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getBehavioralProfile,
  getGestaoProfilesServerSnapshot,
  getGestaoProfilesSnapshot,
  subscribeGestaoProfilesStore,
} from "@/lib/gestao/profiles-store"
import type { OrgUser } from "@/lib/org/types"
import { cn } from "@/lib/utils"

function getUserRoleLabel(user: OrgUser): string {
  if (user.role === "gestor") return "Gestor"
  if (user.role === "admin") return "Admin"
  if (user.kind === "gestao") return "Gestão / Coordenação"
  return "Colaborador"
}

export function LideradoCard({
  user,
  onEdit,
  onDelete,
}: {
  user: OrgUser
  onEdit: (user: OrgUser) => void
  onDelete: (user: OrgUser) => void
}) {
  const profiles = useSyncExternalStore(
    subscribeGestaoProfilesStore,
    getGestaoProfilesSnapshot,
    getGestaoProfilesServerSnapshot
  )

  const behavioral = useMemo(
    () => profiles.behavioral.find((entry) => entry.userId === user.id) ?? getBehavioralProfile(user.id),
    [profiles, user.id]
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{user.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Badge variant="secondary">{getUserRoleLabel(user)}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <DiscProfileBadges profiles={behavioral.discProfiles} />

        {user.managementTitle ? (
          <p className="text-xs text-muted-foreground">Cargo: {user.managementTitle}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/gestao/liderados/${user.id}`}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1")}
          >
            Abrir ficha
            <ArrowUpRight className="size-3.5" />
          </Link>
          <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
            <Pencil className="size-3.5" data-icon="inline-start" />
            Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(user)}>
            <Trash2 className="size-3.5" data-icon="inline-start" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

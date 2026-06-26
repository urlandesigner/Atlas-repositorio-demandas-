"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import {
  getGestaoProfilesServerSnapshot,
  getGestaoProfilesSnapshot,
  subscribeGestaoProfilesStore,
} from "@/lib/gestao/profiles-store"
import { DISC_PROFILES, type DiscProfileId } from "@/lib/gestao/types"
import {
  getDirectReports,
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
import type { OrgUser } from "@/lib/org/types"
import { cn } from "@/lib/utils"

/** Disposição do quadrante DISC: Tarefa↔Pessoas (horizontal) · Ativo↔Reflexivo (vertical) */
const QUADRANT_LAYOUT: DiscProfileId[] = ["executor", "comunicador", "analista", "planejador"]

export function LideradosMatrix() {
  const { session } = useAuth()
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const profiles = useSyncExternalStore(
    subscribeGestaoProfilesStore,
    getGestaoProfilesSnapshot,
    getGestaoProfilesServerSnapshot
  )

  const reports = useMemo(() => {
    if (!session?.userId) return []
    return getDirectReports(session.userId)
  }, [org, session?.userId])

  const { byDominant, semPerfil } = useMemo(() => {
    const byDominant = new Map<DiscProfileId, OrgUser[]>()
    const semPerfil: OrgUser[] = []
    for (const user of reports) {
      const behavioral = profiles.behavioral.find((entry) => entry.userId === user.id)
      const dominant = behavioral?.discProfiles[0]
      if (!dominant) {
        semPerfil.push(user)
        continue
      }
      const list = byDominant.get(dominant) ?? []
      list.push(user)
      byDominant.set(dominant, list)
    }
    return { byDominant, semPerfil }
  }, [reports, profiles])

  if (!reports.length) return null

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">Mapa comportamental</h2>
        <p className="text-xs text-muted-foreground">
          Cada liderado posicionado pelo perfil dominante. Clique para abrir a ficha.
        </p>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2">
        {/* eixo vertical superior */}
        <div aria-hidden className="col-start-2 text-center text-[11px] text-muted-foreground">
          Ativo · Extrovertido
        </div>

        <div aria-hidden className="row-span-2 flex items-center">
          <span className="-rotate-180 text-[11px] text-muted-foreground [writing-mode:vertical-rl]">
            Tarefa
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {QUADRANT_LAYOUT.map((id) => {
            const profile = DISC_PROFILES.find((entry) => entry.id === id)
            if (!profile) return null
            const members = byDominant.get(id) ?? []
            return (
              <div
                key={id}
                className={cn(
                  "flex min-h-32 flex-col gap-2 rounded-xl border p-3",
                  profile.accentClass
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-md bg-background/60 text-xs font-bold">
                      {profile.shortLabel}
                    </span>
                    <span className="text-sm font-semibold">{profile.label}</span>
                  </div>
                  <Badge variant="outline" className="bg-background/60 text-[10px]">
                    {members.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {members.length ? (
                    members.map((user) => (
                      <Link
                        key={user.id}
                        href={`/gestao/liderados/${user.id}`}
                        className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-background"
                      >
                        {user.name}
                      </Link>
                    ))
                  ) : (
                    <span className="text-xs opacity-70">—</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* eixo horizontal: Pessoas (lado direito) abaixo da grade */}
        <div
          aria-hidden
          className="col-start-2 flex items-center justify-between text-[11px] text-muted-foreground"
        >
          <span>Reflexivo · Reservado</span>
          <span>Pessoas</span>
        </div>
      </div>

      {semPerfil.length ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Sem perfil comportamental definido
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {semPerfil.map((user) => (
              <Link
                key={user.id}
                href={`/gestao/liderados/${user.id}`}
                className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/40"
              >
                {user.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

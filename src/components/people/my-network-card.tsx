"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { PersonAvatar } from "@/components/ui/person-avatar"
import type { SocialProfile } from "@/lib/org/social"
import type { OrgUser } from "@/lib/org/types"
import { cn } from "@/lib/utils"

/**
 * Faixa compacta do próprio perfil na rede: âncora + nudge de completude.
 * Regra de contenção: 1 avatar, 2 linhas, 1 ação — nunca vira mini-dashboard.
 */
export function MyNetworkCard({
  user,
  profile,
  className,
}: {
  user: OrgUser
  profile: SocialProfile | null
  className?: string
}) {
  const checklist = [
    { label: "headline", done: Boolean(profile?.headline) },
    { label: "bio", done: Boolean(profile?.bio) },
    { label: "skills", done: Boolean(profile?.skills.length) },
  ]
  const doneCount = checklist.filter((item) => item.done).length
  const missing = checklist.filter((item) => !item.done).map((item) => item.label)
  const complete = doneCount === checklist.length

  // Perfil completo: uma linha só — âncora discreta, sem ocupar palco.
  if (complete) {
    return (
      <Link
        href={`/people/${user.id}`}
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 transition-colors hover:border-brand/40",
          className
        )}
      >
        <PersonAvatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.headline}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand">
          Meu perfil
          <ArrowUpRight className="size-3.5" />
        </span>
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-brand/25 bg-brand-muted/30 p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <PersonAvatar name={user.name} imageUrl={user.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile?.headline || "Sem headline pública ainda"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {checklist.map((item) => (
            <span
              key={item.label}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                item.done ? "bg-brand" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="shrink-0 text-[11px] text-muted-foreground">
          {doneCount} de {checklist.length}
          {missing.length ? ` · falta ${missing.join(" e ")}` : ""}
        </p>
      </div>

      <Link
        href={`/people/${user.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full bg-card")}
      >
        Completar meu perfil
        <ArrowUpRight data-icon="inline-end" />
      </Link>
    </div>
  )
}

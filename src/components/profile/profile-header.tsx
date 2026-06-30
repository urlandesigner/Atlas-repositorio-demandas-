import { Building2, Clock3, Users, type LucideIcon } from "lucide-react"

import { PersonAvatar } from "@/components/ui/person-avatar"
import type { ProfileIdentity } from "@/lib/profile/types"
import { formatTenure } from "@/lib/profile/store"

function Chip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/12 bg-brand-muted/80 px-2.5 py-1 text-xs text-brand-muted-foreground">
      <Icon className="size-3.5" />
      {children}
    </span>
  )
}

export function ProfileHeader({
  identity,
  levelName,
  avatarUrl,
}: {
  identity: ProfileIdentity
  levelName: string
  avatarUrl?: string | null
}) {
  const tenure = formatTenure(identity.startDate)

  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center">
      <PersonAvatar name={identity.name} imageUrl={avatarUrl} size="lg" className="size-14" />

      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-semibold tracking-tight">{identity.name}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {identity.role}
          {levelName ? <span className="text-muted-foreground/70"> · {levelName}</span> : null}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip icon={Building2}>{identity.area}</Chip>
          <Chip icon={Users}>Squad {identity.squad}</Chip>
          {tenure ? <Chip icon={Clock3}>{tenure}</Chip> : null}
        </div>
      </div>
    </div>
  )
}

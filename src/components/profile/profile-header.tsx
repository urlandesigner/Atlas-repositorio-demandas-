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
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 rounded-lg border border-border/60 bg-card p-5 shadow-card">
      {/* Grade de duas colunas: o avatar ocupa as duas primeiras linhas — nome
          e a linha de apoio — e se centra NELAS, não só na do nome. Os chips
          ficam na terceira linha e herdam o recuo pela coluna.

          Antes a caixa do avatar tinha a altura da linha do nome e o círculo
          transbordava dela. Funcionava aos 32px que o avatar realmente
          recebia; quando o tamanho pedido passou a valer, 48px centrado numa
          linha só desequilibrou o bloco.

          Sem número mágico aqui: `row-span-2 self-center` resolve sozinho, e
          muda de altura junto com a tipografia. */}
      <PersonAvatar
        name={identity.name}
        imageUrl={avatarUrl}
        size="xl"
        className="row-span-2 self-center"
      />

      <h2 className="col-start-2 text-xl font-semibold tracking-tight">{identity.name}</h2>
      <p className="col-start-2 mt-0.5 text-sm text-muted-foreground">
        {identity.role}
        {levelName ? <span className="text-muted-foreground/70"> · {levelName}</span> : null}
      </p>

      <div className="col-start-2 mt-3 flex flex-wrap gap-1.5">
        <Chip icon={Building2}>{identity.area}</Chip>
        <Chip icon={Users}>Squad {identity.squad}</Chip>
        {tenure ? <Chip icon={Clock3}>{tenure}</Chip> : null}
      </div>
    </div>
  )
}

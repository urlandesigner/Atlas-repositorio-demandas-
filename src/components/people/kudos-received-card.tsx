"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import { ArrowUpRight, Heart } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  CardList,
  CardListBody,
  CardListNote,
  CardListHeader,
  CardListItem,
  CardListRows,
} from "@/components/ui/card-list"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import {
  getKudosReceived,
  getOrgSocialServerSnapshot,
  getOrgSocialSnapshot,
  KUDO_TYPE_META,
  subscribeOrgSocialStore,
} from "@/lib/org/social"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
import { cn, formatListDate } from "@/lib/utils"

const MAX_ON_HOME = 3

/**
 * Elogios recebidos de colegas, na home.
 *
 * Por que existe: é o único dado da home que a pessoa não pode auto-declarar —
 * todo o resto (registros, objetivos, projetos) é auto-reportado. Os kudos viviam
 * só em /people/<id>, onde ninguém olhava o próprio perfil, então quem recebia
 * nunca via e o loop de reconhecimento morria.
 *
 * Regra de contenção: no máximo 3 linhas, mensagem em 2 linhas, sem contador.
 * Contador viraria KPI e convida troca recíproca — o valor está no conteúdo.
 *
 * Nomenclatura: "elogios" e não "reconhecimentos". `Kudo` (par-a-par, social) e
 * `RecognitionEntry` (auto-declarado, com evidência, alimenta o dossiê em
 * /professional/evolution/recognitions) são conceitos distintos; usar o mesmo
 * rótulo nos dois lugares confunde.
 */
export function KudosReceivedCard({ className }: { className?: string }) {
  const { session } = useAuth()
  const social = useSyncExternalStore(
    subscribeOrgSocialStore,
    getOrgSocialSnapshot,
    getOrgSocialServerSnapshot
  )
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)

  const userId = session?.userId ?? null

  const kudos = useMemo(
    () => (userId ? getKudosReceived(social, userId) : []),
    [social, userId]
  )

  const userById = useMemo(
    () => new Map(org.users.map((user) => [user.id, user])),
    [org.users]
  )

  if (!userId) return null

  return (
    <CardList className={className}>
      <CardListHeader
        title="Elogios de colegas"
        description={
          kudos.length ? undefined : "Mensagens que colegas deixam quando algo seu ajudou."
        }
        action={
          kudos.length ? (
            <Link
              href={`/people/${userId}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver todos
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          ) : null
        }
      />
      <CardListBody>
        {kudos.length ? (
          <CardListRows>
            {kudos.slice(0, MAX_ON_HOME).map((kudo) => {
              const from = userById.get(kudo.fromUserId)
              const meta = KUDO_TYPE_META[kudo.type]

              return (
                <CardListItem
                  key={kudo.id}
                  icon={
                    <span
                      aria-hidden="true"
                      className="flex size-6 items-center justify-center rounded-full bg-brand-muted text-xs"
                    >
                      {meta.emoji}
                    </span>
                  }
                  badges={
                    <Badge variant="outline">
                      {meta.label}
                    </Badge>
                  }
                  title={
                    from ? (
                      <Link
                        href={`/people/${from.id}`}
                        className="hover:text-accent-ink hover:underline"
                      >
                        {from.name}
                      </Link>
                    ) : (
                      "Ex-colaborador"
                    )
                  }
                  text={kudo.message}
                  date={formatListDate(kudo.createdAt)}
                />
              )
            })}
          </CardListRows>
        ) : (
          // Vazio não pode ser cobrança: quem acabou de entrar não recebeu nada
          // ainda. Em vez de exibir um zero, convida a alimentar o loop.
          <div className="px-4 py-4">
            <EmptyStateCard
              icon={Heart}
              title="Nenhum elogio por aqui ainda"
              // Descrição curta: agora o card divide a linha de abertura com
              // Avisos do RH e Foco do ciclo, e é o vazio que define a altura
              // da faixa. O convite já está no botão.
              description="Aparecem aqui assim que um colega deixar o primeiro."
              action={
                <Link href="/people" className={cn(buttonVariants({ size: "sm" }))}>
                  Reconhecer um colega
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
              }
            />
          </div>
        )}
      </CardListBody>
      {/* Nada oculto: `kudos` e a lista inteira, cortada so na renderizacao. */}
      {kudos.length > 0 && kudos.length <= MAX_ON_HOME ? (
        <CardListNote
          action={
            <Link href="/people" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-ink hover:underline">
              Reconhecer um colega
              <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          Nenhum outro elogio recente.
        </CardListNote>
      ) : null}
    </CardList>
  )
}

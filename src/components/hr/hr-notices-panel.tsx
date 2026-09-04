"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { HrNoticeCard } from "@/components/hr/hr-notice-card"
import { buttonVariants } from "@/components/ui/button"
import {
  CardList,
  CardListBody,
  CardListNote,
  CardListHeader,
  CardListRows,
} from "@/components/ui/card-list"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { useHrNotices } from "@/hooks/use-hr-notices"

export function HrNoticesPanel({
  hideWhenEmpty = false,
  compact = false,
  showAll = false,
  hideHeader = false,
}: {
  hideWhenEmpty?: boolean
  /** Dashboard: menos avisos, para dividir a fileira com outros blocos. */
  compact?: boolean
  /** Página /avisos: sem corte, é o lugar onde tudo aparece. */
  showAll?: boolean
  /** A página já tem o próprio PageHeader; o card não repete o título. */
  hideHeader?: boolean
}) {
  const { notices, isUnread, markRead } = useHrNotices(
    showAll ? Number.POSITIVE_INFINITY : compact ? 3 : 4
  )

  if (hideWhenEmpty && notices.length === 0) return null

  return (
    <CardList className="h-full">
      {hideHeader ? null : (
        <CardListHeader
          title="Avisos do RH"
          description={
            compact
              ? undefined
              : "Comunicados importantes para orientar prazos, benefícios e rituais do ciclo."
          }
          // "Ver todos" no lugar do badge de contagem: o badge mostrava
          // `notices.length`, que já vem cortado em 3 — então dizia "3" tanto
          // com três avisos quanto com dez. Contagem errada não é informação, e
          // o link resolve o que ela tentava sinalizar.
          action={
            showAll ? null : (
              <Link
                href="/avisos"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Ver todos
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            )
          }
        />
      )}
      <CardListBody>
        {notices.length ? (
          <CardListRows>
            {notices.map((notice) => (
              <HrNoticeCard
                key={notice.id}
                notice={notice}
                isUnread={isUnread(notice.id)}
                onMarkRead={markRead ? () => markRead(notice.id) : undefined}
              />
            ))}
          </CardListRows>
        ) : (
          <div className="px-4 py-4">
            <EmptyStateCard
              title="Nenhum aviso do RH no momento"
              description="Quando houver recados relevantes para o ciclo ou para benefícios, eles aparecem aqui."
            />
          </div>
        )}
      </CardListBody>
      {/* Só quando a lista veio MENOR que o teto: `slice(0, limit)` devolve
          menos que `limit` apenas quando não há mais nada, então aqui é certo
          dizer que não há. Com a lista cheia, o que faltaria dizer seria outra
          coisa — quantos ficaram de fora —, e isso é trabalho do cabeçalho.

          "Nenhum outro" e não "você está em dia": a nota fala de COMPLETUDE da
          lista, e "em dia" falaria de leitura. O cartão marca não-lido com badge
          "Novo", então a primeira versão se contradizia na própria tela — dizia
          que estava tudo em dia com dois "Novo" logo acima. */}
      {notices.length > 0 && notices.length < (showAll ? Number.POSITIVE_INFINITY : compact ? 3 : 4) ? (
        // Sem ação: aviso do RH quem cria é o admin, não quem lê. Um link aqui
        // seria simetria pela simetria, levando a uma tela que não faz nada
        // além de repetir esta lista.
        <CardListNote>Nenhum outro aviso no momento.</CardListNote>
      ) : null}
    </CardList>
  )
}

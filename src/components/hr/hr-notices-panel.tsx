"use client"

import { HrNoticeCard } from "@/components/hr/hr-notice-card"
import { Badge } from "@/components/ui/badge"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRows,
} from "@/components/ui/card-list"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { useHrNotices } from "@/hooks/use-hr-notices"

export function HrNoticesPanel({
  hideWhenEmpty = false,
  compact = false,
}: {
  hideWhenEmpty?: boolean
  compact?: boolean
}) {
  // Modo compacto (dashboard): menos avisos e corpo em uma linha, para dividir a
  // fileira com outros blocos em vez de ocupar a largura toda.
  const { notices, unreadCount, isUnread, markRead } = useHrNotices(compact ? 3 : 4)

  if (hideWhenEmpty && notices.length === 0) return null

  return (
    <CardList className="h-full">
      <CardListHeader
        title="Avisos do RH"
        description={
          compact
            ? undefined
            : "Comunicados importantes para orientar prazos, benefícios e rituais do ciclo."
        }
        action={
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? <Badge variant="secondary">{unreadCount} novo(s)</Badge> : null}
            <Badge variant="outline">{notices.length}</Badge>
          </div>
        }
      />
      <CardListBody>
        {notices.length ? (
          <CardListRows>
            {notices.map((notice) => (
              <HrNoticeCard
                key={notice.id}
                notice={notice}
                isUnread={isUnread(notice.id)}
                onMarkRead={markRead ? () => markRead(notice.id) : undefined}
                compact={compact}
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
    </CardList>
  )
}

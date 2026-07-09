"use client"

import { useMemo, useSyncExternalStore } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { HrNoticeCard } from "@/components/hr/hr-notice-card"
import { Badge } from "@/components/ui/badge"
import {
  CardList,
  CardListBody,
  CardListHeader,
  CardListRows,
} from "@/components/ui/card-list"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import {
  getHrNoticesForRole,
  getHrNoticeReadsServerSnapshot,
  getHrNoticeReadsSnapshot,
  getHrNoticesServerSnapshot,
  getHrNoticesSnapshot,
  isHrNoticeUnread,
  markHrNoticeRead,
  subscribeHrNoticeReadsStore,
  subscribeHrNoticesStore,
} from "@/lib/hr/store"

export function HrNoticesPanel() {
  const { session } = useAuth()
  const noticesData = useSyncExternalStore(
    subscribeHrNoticesStore,
    getHrNoticesSnapshot,
    getHrNoticesServerSnapshot
  )
  const reads = useSyncExternalStore(
    subscribeHrNoticeReadsStore,
    getHrNoticeReadsSnapshot,
    getHrNoticeReadsServerSnapshot
  )

  const notices = useMemo(
    () => getHrNoticesForRole(session?.role, session?.areaId, noticesData).slice(0, 4),
    [noticesData, session?.areaId, session?.role]
  )
  const unreadCount = useMemo(
    () =>
      notices.filter((notice) => isHrNoticeUnread(session?.userId, notice.id, reads)).length,
    [notices, reads, session?.userId]
  )

  return (
    <CardList>
      <CardListHeader
        title="Avisos do RH"
        description="Comunicados importantes para orientar prazos, benefícios e rituais do ciclo."
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
                isUnread={isHrNoticeUnread(session?.userId, notice.id, reads)}
                onMarkRead={
                  session?.userId
                    ? () => markHrNoticeRead(session.userId, notice.id)
                    : undefined
                }
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

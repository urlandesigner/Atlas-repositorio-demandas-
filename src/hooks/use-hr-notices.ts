"use client"

import { useMemo, useSyncExternalStore } from "react"

import { useAuth } from "@/components/auth/auth-provider"
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

// Avisos do RH da sessão atual, já filtrados por papel/área e ordenados pelo store.
// Centraliza a assinatura dos stores para que o painel e o dashboard compartilhem
// a mesma fonte (o dashboard precisa saber se há avisos para decidir o layout).
export function useHrNotices(limit = 4) {
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
    () => getHrNoticesForRole(session?.role, session?.areaId, noticesData).slice(0, limit),
    [noticesData, session?.areaId, session?.role, limit]
  )
  const unreadCount = useMemo(
    () => notices.filter((notice) => isHrNoticeUnread(session?.userId, notice.id, reads)).length,
    [notices, reads, session?.userId]
  )

  const userId = session?.userId
  return {
    notices,
    unreadCount,
    isUnread: (noticeId: string) => isHrNoticeUnread(userId, noticeId, reads),
    markRead: userId ? (noticeId: string) => markHrNoticeRead(userId, noticeId) : undefined,
  }
}

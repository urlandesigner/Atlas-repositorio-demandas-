"use client"

import { useMemo, useSyncExternalStore } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  AUDIT_ACTION_LABEL,
  getAuditForArea,
  getAuditServerSnapshot,
  getAuditSnapshot,
  subscribeAuditStore,
} from "@/lib/gestao/audit/store"

export function AdminAuditPanel() {
  const { session } = useAuth()
  const auditData = useSyncExternalStore(
    subscribeAuditStore,
    getAuditSnapshot,
    getAuditServerSnapshot
  )

  const entries = useMemo(() => {
    if (!session?.areaId) return []
    return getAuditForArea(session.areaId).slice(0, 50)
  }, [auditData, session?.areaId])

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {entries.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm">{entry.summary}</p>
              <p className="text-xs text-muted-foreground">
                {entry.actorName} · {new Date(entry.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <Badge variant="outline">{AUDIT_ACTION_LABEL[entry.action]}</Badge>
          </div>
        ))}
        {!entries.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum evento registrado ainda.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

"use client"

import { useMemo, useSyncExternalStore } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getGestaoObjectivesServerSnapshot,
  getGestaoObjectivesSnapshot,
  getObjectivesForUser,
  OBJECTIVE_STATUS_LABEL,
  PDI_DIMENSION_LABEL,
  subscribeGestaoObjectivesStore,
} from "@/lib/gestao/objectives/store"

export function AssignedObjectivesSection({ userId }: { userId: string }) {
  const objectivesData = useSyncExternalStore(
    subscribeGestaoObjectivesStore,
    getGestaoObjectivesSnapshot,
    getGestaoObjectivesServerSnapshot
  )

  const assigned = useMemo(
    () => getObjectivesForUser(userId),
    [objectivesData, userId]
  )

  if (!assigned.length) return null

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Objetivos do gestor</h2>
        <p className="text-xs text-muted-foreground">
          Metas definidas pelo seu gestor para o ciclo atual.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {assigned.map((objective) => (
          <Card key={objective.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{objective.title}</CardTitle>
                <Badge variant="secondary">Definido pelo gestor</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {objective.motivation ? <p>{objective.motivation}</p> : null}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{OBJECTIVE_STATUS_LABEL[objective.status]}</Badge>
                {objective.dimensions.map((dimension) => (
                  <Badge key={dimension} variant="outline">
                    {PDI_DIMENSION_LABEL[dimension]}
                  </Badge>
                ))}
              </div>
              {objective.deadline ? (
                <p className="text-xs">Prazo: {objective.deadline}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

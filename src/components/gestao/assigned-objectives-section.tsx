"use client"

import { useMemo, useSyncExternalStore, useState } from "react"
import { CalendarDays, Plus } from "lucide-react"

import { useRecords } from "@/components/shell/records-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ListRowButton } from "@/components/ui/list-row-button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/ui/status-badge"
import { OBJECTIVE_STATUS_TONE } from "@/lib/status-tone"
import { getRecordImpactText } from "@/lib/records/display"
import {
  countGestaoObjectiveEvidence,
  getGestaoObjectivesServerSnapshot,
  getGestaoObjectivesSnapshot,
  getObjectivesForUser,
  OBJECTIVE_STATUS_LABEL,
  PDI_DIMENSION_LABEL,
  subscribeGestaoObjectivesStore,
  type GestaoObjective,
} from "@/lib/gestao/objectives/store"

function formatDeadline(iso: string | null) {
  if (!iso) return null
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function AssignedObjectivesSection({ userId }: { userId: string }) {
  const { records, openCapture, openDetail } = useRecords()
  const objectivesData = useSyncExternalStore(
    subscribeGestaoObjectivesStore,
    getGestaoObjectivesSnapshot,
    getGestaoObjectivesServerSnapshot
  )

  const assigned = useMemo(
    () => getObjectivesForUser(userId),
    [objectivesData, userId]
  )

  const [selected, setSelected] = useState<GestaoObjective | null>(null)
  const linkedRecords = selected
    ? records.filter((record) => selected.linkedRecordIds.includes(record.id))
    : []

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
          <Card
            key={objective.id}
            className="h-full cursor-pointer hover:-translate-y-0.5 hover:border-foreground/12 hover:shadow-card-hover"
            onClick={() => setSelected(objective)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 flex-1 line-clamp-2 text-sm font-medium leading-snug">{objective.title}</h3>
                <StatusBadge tone={OBJECTIVE_STATUS_TONE[objective.status]} className="shrink-0 font-normal">
                  {OBJECTIVE_STATUS_LABEL[objective.status]}
                </StatusBadge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="font-normal">
                  Definido pelo gestor
                </Badge>
                {objective.dimensions.map((dimension) => (
                  <Badge key={dimension} variant="outline" className="font-normal">
                    {PDI_DIMENSION_LABEL[dimension]}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="line-clamp-3 text-xs text-muted-foreground">
                {objective.motivation || "Sem motivação registrada."}
              </p>
              {objective.deadline ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  <span>Prazo: {formatDeadline(objective.deadline)}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[38rem] sm:data-[side=right]:max-w-[38rem]" side="right">
          {selected && (
            <>
              <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="text-base">{selected.title}</SheetTitle>
                  <StatusBadge tone={OBJECTIVE_STATUS_TONE[selected.status]} className="font-normal">
                    {OBJECTIVE_STATUS_LABEL[selected.status]}
                  </StatusBadge>
                  <Badge variant="secondary">Definido pelo gestor</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDeadline(selected.deadline) ? `Prazo: ${formatDeadline(selected.deadline)}` : "Sem prazo definido"}
                </p>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-5 px-5 py-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Evidências</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {countGestaoObjectiveEvidence(selected)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Competências</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">
                        {selected.dimensions.length}
                      </p>
                    </div>
                  </div>

                  {selected.dimensions.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selected.dimensions.map((dimension) => (
                        <Badge key={dimension} variant="outline" className="font-normal">
                          {PDI_DIMENSION_LABEL[dimension]}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <Separator />

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Motivação</p>
                    <p className="text-sm text-muted-foreground">{selected.motivation ?? "—"}</p>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Plano de ação</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {selected.actionPlan ?? "—"}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Evidências esperadas</p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {selected.expectedEvidence ?? "—"}
                    </p>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Registros vinculados</p>
                    {linkedRecords.length ? (
                      <div className="flex flex-col gap-2">
                        {linkedRecords.map((record) => (
                          <ListRowButton
                            key={record.id}
                            onClick={() => {
                              setSelected(null)
                              openDetail(record)
                            }}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-1 block text-sm font-medium text-foreground">
                                {record.enriched.title}
                              </span>
                              <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                                {getRecordImpactText(record) || record.raw}
                              </span>
                            </span>
                          </ListRowButton>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem registros vinculados ainda.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t px-5 py-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    const objective = selected
                    setSelected(null)
                    openCapture({
                      objective: { id: objective.id, title: objective.title, source: "gestao" },
                    })
                  }}
                >
                  <Plus data-icon="inline-start" />
                  Registrar avanço
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

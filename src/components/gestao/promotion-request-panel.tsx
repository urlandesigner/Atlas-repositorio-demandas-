"use client"

import { useMemo, useState } from "react"
import { ArrowUpCircle, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getLadderLevelIndex,
  type PdiFramework,
  type PdiPromotionRequest,
} from "@/lib/gestao/pdi/types"
import {
  cancelPromotionRequest,
  submitPromotionRequest,
} from "@/lib/gestao/pdi/store"

const STATUS_LABEL: Record<PdiPromotionRequest["status"], string> = {
  pending: "Aguardando admin",
  approved: "Aprovada",
  rejected: "Reprovada",
  cancelled: "Cancelada",
}

export function PromotionRequestPanel({
  assignmentId,
  framework,
  managerId,
  areaId,
  currentLevelId,
  readiness,
  pendingRequest,
  recentRequests,
}: {
  assignmentId: string
  framework: PdiFramework
  managerId: string
  areaId: string
  currentLevelId: string
  readiness: number
  pendingRequest?: PdiPromotionRequest
  recentRequests: PdiPromotionRequest[]
}) {
  const [toLevelId, setToLevelId] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const higherLevels = useMemo(() => {
    const currentIndex = getLadderLevelIndex(framework, currentLevelId)
    return framework.ladder.filter((_, index) => index > currentIndex)
  }, [framework, currentLevelId])

  function handleSubmit() {
    if (!toLevelId) {
      setError("Selecione o nível proposto.")
      return
    }

    try {
      submitPromotionRequest({
        assignmentId,
        managerId,
        areaId,
        toLevelId,
        managerNotes: notes,
      })
      setNotes("")
      setToLevelId("")
      setError(null)
      setSaved("Solicitação enviada para aprovação.")
      window.setTimeout(() => setSaved(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar.")
    }
  }

  function handleCancel() {
    if (!pendingRequest) return
    try {
      cancelPromotionRequest(pendingRequest.id, managerId)
      setSaved("Solicitação cancelada.")
      window.setTimeout(() => setSaved(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cancelar.")
    }
  }

  const currentLevelName =
    framework.ladder.find((level) => level.id === currentLevelId)?.name ?? "—"

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Subida no PDI</CardTitle>
          {pendingRequest ? (
            <Badge variant="secondary">{STATUS_LABEL.pending}</Badge>
          ) : null}
          {saved ? <span className="text-sm text-brand">{saved}</span> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Ao fim do ciclo, recomende a evolução na trilha para aprovação do admin de área.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequest ? (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
            <p className="font-medium">
              {currentLevelName} →{" "}
              {framework.ladder.find((level) => level.id === pendingRequest.toLevelId)?.name ??
                "—"}
            </p>
            <p className="mt-1 text-muted-foreground">
              Prontidão na solicitação: {pendingRequest.readiness}%
            </p>
            {pendingRequest.managerNotes ? (
              <p className="mt-2 text-muted-foreground">{pendingRequest.managerNotes}</p>
            ) : null}
            <Button variant="outline" size="sm" className="mt-3" onClick={handleCancel}>
              <XCircle data-icon="inline-start" />
              Cancelar solicitação
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Prontidão atual:</span>
              <Badge variant={readiness >= 80 ? "default" : "outline"}>{readiness}%</Badge>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Nível proposto</span>
              <Select value={toLevelId} onValueChange={(value) => value && setToLevelId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o próximo nível" />
                </SelectTrigger>
                <SelectContent>
                  {higherLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Justificativa (opcional)</span>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Evidências, contexto do ciclo, recomendação…"
                rows={3}
              />
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button onClick={handleSubmit} disabled={!higherLevels.length}>
              <ArrowUpCircle data-icon="inline-start" />
              Solicitar aprovação de subida
            </Button>
            {!higherLevels.length ? (
              <p className="text-xs text-muted-foreground">
                Colaborador já está no nível mais alto da trilha.
              </p>
            ) : null}
          </>
        )}

        {recentRequests.filter((request) => request.status !== "pending").length ? (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Histórico
            </p>
            {recentRequests
              .filter((request) => request.status !== "pending")
              .slice(0, 3)
              .map((request) => (
                <div key={request.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {framework.ladder.find((level) => level.id === request.fromLevelId)?.name} →{" "}
                    {framework.ladder.find((level) => level.id === request.toLevelId)?.name}
                  </span>{" "}
                  · {STATUS_LABEL[request.status]}
                  {request.adminNotes ? ` — ${request.adminNotes}` : ""}
                </div>
              ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

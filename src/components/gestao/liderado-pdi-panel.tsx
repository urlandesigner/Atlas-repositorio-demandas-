"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { Plus } from "lucide-react"

import {
  AssignedPdiSection,
  AssignPdiSheet,
} from "@/components/gestao/assign-pdi-sheet"
import { PromotionRequestPanel } from "@/components/gestao/promotion-request-panel"
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
import {
  computeFrameworkReadiness,
  getFrameworkExpectations,
} from "@/lib/gestao/pdi/types"
import {
  closeAssignment,
  getActiveAssignmentForUser,
  getFrameworkById,
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  getPendingPromotionForAssignment,
  getPromotionRequestsForManager,
  setAssignmentThemeLevel,
  subscribeGestaoPdiStore,
  updateAssignmentLevel,
} from "@/lib/gestao/pdi/store"
import type { OrgUser } from "@/lib/org/types"

export function LideradoPdiPanel({
  collaborator,
  managerId,
  areaId,
}: {
  collaborator: OrgUser
  managerId: string
  areaId: string
}) {
  const pdiData = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )
  const [sheetOpen, setSheetOpen] = useState(false)

  const assignment = useMemo(
    () => getActiveAssignmentForUser(collaborator.id),
    [collaborator.id, pdiData.assignments]
  )

  const framework = useMemo(
    () => (assignment ? getFrameworkById(assignment.frameworkId) : undefined),
    [assignment, pdiData.frameworks]
  )

  const pendingRequest = useMemo(
    () => (assignment ? getPendingPromotionForAssignment(assignment.id) : undefined),
    [assignment, pdiData.promotionRequests]
  )

  const promotionHistory = useMemo(
    () =>
      assignment
        ? getPromotionRequestsForManager(managerId).filter(
            (request) => request.assignmentId === assignment.id
          )
        : [],
    [assignment, managerId, pdiData.promotionRequests]
  )

  if (!assignment || !framework) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PDI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nenhum PDI ativo. Aplique uma trilha para acompanhar competências neste ciclo.
            </p>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus data-icon="inline-start" />
              Aplicar PDI
            </Button>
          </CardContent>
        </Card>

        <AssignPdiSheet
          key={sheetOpen ? `${collaborator.id}-assign-open` : `${collaborator.id}-assign-closed`}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          collaborator={collaborator}
          managerId={managerId}
        />
      </>
    )
  }

  const currentLevels = Object.fromEntries(
    framework.themes.map((theme) => [theme.id, assignment.current[theme.id]?.level ?? 0])
  )
  const expectedLevels = getFrameworkExpectations(framework, assignment.currentLevelId)
  const readiness = computeFrameworkReadiness(
    currentLevels,
    expectedLevels,
    framework.themes.map((theme) => theme.id)
  )
  const currentLevelName =
    framework.ladder.find((level) => level.id === assignment.currentLevelId)?.name ?? "—"
  const targetLevelName = assignment.targetLevelId
    ? framework.ladder.find((level) => level.id === assignment.targetLevelId)?.name
    : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={readiness >= 80 ? "default" : "outline"}>{readiness}% pronto</Badge>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Nível na trilha</span>
          <Select
            value={assignment.currentLevelId}
            onValueChange={(levelId) => levelId && updateAssignmentLevel(assignment.id, levelId)}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue>
                {(value) =>
                  framework.ladder.find((level) => level.id === value)?.name ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {framework.ladder.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button variant="outline" size="sm" onClick={() => closeAssignment(assignment.id)}>
          Encerrar PDI
        </Button>
      </div>

      <AssignedPdiSection
        framework={framework}
        currentLevels={currentLevels}
        expectedLevels={expectedLevels}
        currentLevelName={currentLevelName}
        targetLevelName={targetLevelName}
        cycleLabel={assignment.cycleLabel}
        onLevelChange={(themeId, level) =>
          setAssignmentThemeLevel(assignment.id, themeId, level)
        }
      />

      <PromotionRequestPanel
        assignmentId={assignment.id}
        framework={framework}
        managerId={managerId}
        areaId={areaId}
        currentLevelId={assignment.currentLevelId}
        readiness={readiness}
        pendingRequest={pendingRequest}
        recentRequests={promotionHistory}
      />
    </div>
  )
}

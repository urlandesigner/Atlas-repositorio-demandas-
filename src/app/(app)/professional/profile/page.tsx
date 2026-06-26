"use client"

import { useMemo, useSyncExternalStore } from "react"

import { AiInsightsPanel } from "@/components/profile/ai-insights-panel"
import { CareerGoalCard } from "@/components/profile/career-goal-card"
import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { ImpactSummarySection } from "@/components/profile/impact-summary"
import { PdiCompactCard } from "@/components/profile/pdi-compact-card"
import { ProfileHeader } from "@/components/profile/profile-header"
import { AssignedPdiSection } from "@/components/gestao/assign-pdi-sheet"
import { CollaboratorGestaoInsights } from "@/components/gestao/collaborator-gestao-insights"
import { useOptionalSession } from "@/hooks/use-optional-session"
import { computeImpactSummary } from "@/lib/profile/derive"
import {
  computePdiReadiness,
  computeProjectedPdiLevels,
  type PdiTheme,
} from "@/lib/profile/pdi"
import {
  getBaselineLevels,
  getPdiServerSnapshot,
  getPdiSnapshot,
  subscribePdiStore,
} from "@/lib/profile/pdi-store"
import {
  getFrameworkExpectations,
  computeFrameworkReadiness,
} from "@/lib/gestao/pdi/types"
import {
  getActiveAssignmentForUser,
  getFrameworkById,
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import {
  getObjectivesServerSnapshot,
  getObjectivesSnapshot,
  subscribeObjectivesStore,
} from "@/lib/objectives/store"
import {
  findLevel,
  getProfileServerSnapshot,
  getProfileSnapshot,
  subscribeProfileStore,
} from "@/lib/profile/store"
import { useRecords } from "@/components/shell/records-provider"

export default function ProfilePage() {
  const { records } = useRecords()
  const session = useOptionalSession()
  const profile = useSyncExternalStore(
    subscribeProfileStore,
    getProfileSnapshot,
    getProfileServerSnapshot
  )
  const pdi = useSyncExternalStore(subscribePdiStore, getPdiSnapshot, getPdiServerSnapshot)
  const objectives = useSyncExternalStore(
    subscribeObjectivesStore,
    getObjectivesSnapshot,
    getObjectivesServerSnapshot
  )
  const gestaoPdi = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )

  const assigned = useMemo(() => {
    if (!session?.userId) return undefined
    return getActiveAssignmentForUser(session.userId)
  }, [session?.userId, gestaoPdi.assignments])

  const assignedFramework = useMemo(
    () => (assigned ? getFrameworkById(assigned.frameworkId) : undefined),
    [assigned, gestaoPdi.frameworks]
  )

  const summary = useMemo(() => computeImpactSummary(records), [records])

  const pdiBaseline = useMemo(() => getBaselineLevels(pdi), [pdi])
  const pdiProjected = useMemo(
    () => computeProjectedPdiLevels(pdiBaseline, objectives, pdi.expected),
    [pdiBaseline, objectives, pdi.expected]
  )

  const assignedCurrent = useMemo(() => {
    if (!assigned || !assignedFramework) return null
    return Object.fromEntries(
      assignedFramework.themes.map((theme) => [
        theme.id,
        assigned.current[theme.id]?.level ?? 0,
      ])
    ) as Record<PdiTheme, number>
  }, [assigned, assignedFramework])

  const assignedExpected = useMemo(() => {
    if (!assigned || !assignedFramework) return null
    return getFrameworkExpectations(assignedFramework, assigned.currentLevelId) as Record<
      PdiTheme,
      number
    >
  }, [assigned, assignedFramework])

  const insightsCurrent = assignedCurrent ?? pdiBaseline
  const insightsExpected = assignedExpected ?? pdi.expected

  const readiness = useMemo(() => {
    if (assignedCurrent && assignedExpected && assignedFramework) {
      return computeFrameworkReadiness(
        assignedCurrent,
        assignedExpected,
        assignedFramework.themes.map((theme) => theme.id)
      )
    }
    return computePdiReadiness(pdiBaseline, pdi.expected)
  }, [assignedCurrent, assignedExpected, assignedFramework, pdiBaseline, pdi.expected])

  const currentLevel = findLevel(profile.ladder, profile.identity.levelId)

  return (
    <EvolutionShell
      title="Meu Perfil"
      description="Sua identidade, evolução de PDI e objetivo de carreira em um só lugar."
    >
      <div className="flex flex-col gap-6">
      <ProfileHeader identity={profile.identity} levelName={currentLevel?.name ?? ""} />

      <ImpactSummarySection summary={summary} />

      {session?.userId ? (
        <CollaboratorGestaoInsights userId={session.userId} areaId={session.areaId} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {assigned && assignedFramework && assignedCurrent && assignedExpected ? (
          <AssignedPdiSection
            framework={assignedFramework}
            currentLevels={assignedCurrent}
            expectedLevels={assignedExpected}
            currentLevelName={
              assignedFramework.ladder.find((level) => level.id === assigned.currentLevelId)
                ?.name ?? "—"
            }
            targetLevelName={
              assigned.targetLevelId
                ? assignedFramework.ladder.find((level) => level.id === assigned.targetLevelId)
                    ?.name
                : null
            }
            cycleLabel={assigned.cycleLabel}
            readOnly
          />
        ) : (
          <PdiCompactCard
            baseline={pdiBaseline}
            projected={pdiProjected}
            expected={pdi.expected}
            baselineAt={pdi.baselineAt}
            objectives={objectives}
          />
        )}
        <AiInsightsPanel current={insightsCurrent} expected={insightsExpected} />
      </div>

      <CareerGoalCard
        goal={profile.goal}
        ladder={profile.ladder}
        currentLevelId={profile.identity.levelId}
        progress={readiness}
      />
      </div>
    </EvolutionShell>
  )
}

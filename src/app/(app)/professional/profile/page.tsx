"use client"

import { useMemo, useSyncExternalStore } from "react"

import { AiInsightsPanel } from "@/components/profile/ai-insights-panel"
import { CareerGoalCard } from "@/components/profile/career-goal-card"
import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { ImpactSummarySection } from "@/components/profile/impact-summary"
import { NextPdiHighlight } from "@/components/profile/next-pdi-highlight"
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
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
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
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const gestaoPdi = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )

  const assigned = useMemo(() => {
    if (!session?.userId) return undefined
    return gestaoPdi.assignments.find(
      (assignment) => assignment.userId === session.userId && assignment.status === "active"
    )
  }, [gestaoPdi.assignments, session])

  const assignedFramework = useMemo(
    () => (assigned ? gestaoPdi.frameworks.find((framework) => framework.id === assigned.frameworkId) : undefined),
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
  const currentUser = useMemo(
    () => org.users.find((user) => user.id === session?.userId),
    [org.users, session?.userId]
  )

  // A identidade exibida deriva do usuário logado (mesma fonte da saudação do
  // dashboard); o restante (cargo, área, trilha) segue o perfil até haver edição.
  const displayIdentity = useMemo(
    () =>
      currentUser?.name
        ? { ...profile.identity, name: currentUser.name }
        : profile.identity,
    [currentUser?.name, profile.identity]
  )

  return (
    <EvolutionShell
      title="Meu Perfil"
      description="Identidade, PDI e objetivo de carreira no mesmo lugar."
    >
      <div className="flex flex-col gap-6">
      <ProfileHeader
        identity={displayIdentity}
        levelName={currentLevel?.name ?? ""}
        avatarUrl={currentUser?.avatarUrl}
      />

      <NextPdiHighlight baselineAt={pdi.baselineAt} />

      <ImpactSummarySection summary={summary} />

      {session?.userId ? (
        <CollaboratorGestaoInsights userId={session.userId} areaId={session.areaId} />
      ) : null}

      <div id="pdi" className="grid scroll-mt-24 grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
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

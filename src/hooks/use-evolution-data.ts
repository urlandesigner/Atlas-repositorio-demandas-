"use client"

import { useMemo, useSyncExternalStore } from "react"

import { useRecords } from "@/components/shell/records-provider"
import {
  getObjectivesServerSnapshot,
  getObjectivesSnapshot,
  subscribeObjectivesStore,
} from "@/lib/objectives/store"
import {
  computePdiReadiness,
  computeProjectedPdiLevels,
  PDI_THEMES,
  type PdiTheme,
} from "@/lib/profile/pdi"
import {
  getBaselineLevels,
  getPdiServerSnapshot,
  getPdiSnapshot,
  subscribePdiStore,
} from "@/lib/profile/pdi-store"
import {
  findLevel,
  getProfileServerSnapshot,
  getProfileSnapshot,
  subscribeProfileStore,
} from "@/lib/profile/store"
import {
  getPresentationsServerSnapshot,
  getPresentationsSnapshot,
  subscribePresentationsStore,
} from "@/lib/presentations/store"
import {
  getRecognitionsServerSnapshot,
  getRecognitionsSnapshot,
  subscribeRecognitionsStore,
} from "@/lib/evolution/recognitions-store"
import {
  getTimelinePinsServerSnapshot,
  getTimelinePinsSnapshot,
  subscribeTimelinePinsStore,
} from "@/lib/timeline/pins-store"
import { countStrongCompetencies, computeCompetencyEvidence } from "@/lib/evolution/radar"

export function useEvolutionData() {
  const { records, openDetail, openCapture } = useRecords()
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
  const recognitions = useSyncExternalStore(
    subscribeRecognitionsStore,
    getRecognitionsSnapshot,
    getRecognitionsServerSnapshot
  )
  const presentations = useSyncExternalStore(
    subscribePresentationsStore,
    getPresentationsSnapshot,
    getPresentationsServerSnapshot
  )
  const pinnedIds = useSyncExternalStore(
    subscribeTimelinePinsStore,
    getTimelinePinsSnapshot,
    getTimelinePinsServerSnapshot
  )

  const pdiBaseline = useMemo(() => getBaselineLevels(pdi), [pdi])

  const pdiProjected = useMemo(
    () => computeProjectedPdiLevels(pdiBaseline, objectives, pdi.expected),
    [pdiBaseline, objectives, pdi.expected]
  )

  const pdiCurrent = useMemo(
    () =>
      Object.fromEntries(PDI_THEMES.map((t) => [t, pdi.current[t].level])) as Record<
        PdiTheme,
        number
      >,
    [pdi]
  )

  const readiness = useMemo(
    () => computePdiReadiness(pdiCurrent, pdi.expected),
    [pdiCurrent, pdi.expected]
  )

  const projectedReadiness = useMemo(
    () => computePdiReadiness(pdiProjected, pdi.expected),
    [pdiProjected, pdi.expected]
  )

  const currentLevel = findLevel(profile.ladder, profile.identity.levelId)
  const targetLevelId = profile.goal.targetLevelId

  const competencyViews = useMemo(
    () =>
      computeCompetencyEvidence(records, pdiBaseline, pdi.expected, targetLevelId),
    [records, pdiBaseline, pdi.expected, targetLevelId]
  )

  const strongCount = useMemo(() => countStrongCompetencies(competencyViews), [competencyViews])

  return {
    records,
    openDetail,
    openCapture,
    profile,
    pdi,
    pdiBaseline,
    pdiProjected,
    pdiCurrent,
    objectives,
    recognitions,
    presentations,
    pinnedIds,
    readiness,
    projectedReadiness,
    currentLevel,
    competencyViews,
    strongCount,
  }
}

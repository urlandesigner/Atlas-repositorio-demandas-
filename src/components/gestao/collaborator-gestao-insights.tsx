"use client"

import { useMemo, useSyncExternalStore } from "react"

import { DiscProfileBadges } from "@/components/gestao/disc-profile-picker"
import { SoftSkillsRadarChart } from "@/components/gestao/soft-skills-radar-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAreaPermissions,
  getPermissionsServerSnapshot,
  getPermissionsSnapshot,
  subscribePermissionsStore,
} from "@/lib/gestao/permissions/store"
import {
  getBehavioralProfile,
  getGestaoProfilesServerSnapshot,
  getGestaoProfilesSnapshot,
  getSoftSkillsRadar,
  subscribeGestaoProfilesStore,
} from "@/lib/gestao/profiles-store"

export function CollaboratorGestaoInsights({
  userId,
  areaId,
}: {
  userId: string
  areaId: string | null
}) {
  const permissionsData = useSyncExternalStore(
    subscribePermissionsStore,
    getPermissionsSnapshot,
    getPermissionsServerSnapshot
  )
  const profiles = useSyncExternalStore(
    subscribeGestaoProfilesStore,
    getGestaoProfilesSnapshot,
    getGestaoProfilesServerSnapshot
  )

  const permissions = useMemo(
    () => (areaId ? getAreaPermissions(areaId) : null),
    [areaId, permissionsData]
  )

  const behavioral = useMemo(
    () => getBehavioralProfile(userId),
    [profiles, userId]
  )
  const softSkills = useMemo(
    () => getSoftSkillsRadar(userId),
    [profiles, userId]
  )

  if (!permissions) return null

  const showDisc = permissions.collaboratorCanViewDisc && behavioral.discProfiles.length > 0
  const showSoftSkills = permissions.collaboratorCanViewSoftSkills
  const showLeadership =
    permissions.collaboratorCanViewHowToLead &&
    (behavioral.howToLead || behavioral.howNotToLead)

  if (!showDisc && !showSoftSkills && !showLeadership) return null

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-medium">Insights do gestor</h2>
        <p className="text-xs text-muted-foreground">
          Informações compartilhadas pela liderança — somente leitura.
        </p>
      </div>

      {showDisc ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Perfil comportamental</CardTitle>
              <Badge variant="secondary">Gestor</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DiscProfileBadges profiles={behavioral.discProfiles} />
            {behavioral.strengths ? (
              <p>
                <span className="font-medium">Forças: </span>
                {behavioral.strengths}
              </p>
            ) : null}
            {behavioral.attentionPoints ? (
              <p>
                <span className="font-medium">Pontos de atenção: </span>
                {behavioral.attentionPoints}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showSoftSkills ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Competências</CardTitle>
              <Badge variant="secondary">Avaliação do gestor</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <SoftSkillsRadarChart
              pillars={softSkills.pillars}
              scores={softSkills.scores}
            />
          </CardContent>
        </Card>
      ) : null}

      {showLeadership ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orientações de liderança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {behavioral.howToLead ? (
              <p>
                <span className="font-medium text-foreground">Como liderar: </span>
                {behavioral.howToLead}
              </p>
            ) : null}
            {behavioral.howNotToLead ? (
              <p>
                <span className="font-medium text-foreground">Como NÃO liderar: </span>
                {behavioral.howNotToLead}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}

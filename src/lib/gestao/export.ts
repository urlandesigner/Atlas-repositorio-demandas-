import { getAuditForArea } from "@/lib/gestao/audit/store"
import { getGestaoObjectivesSnapshot } from "@/lib/gestao/objectives/store"
import { getAreaPermissions } from "@/lib/gestao/permissions/store"
import { getGestaoPdiSnapshot } from "@/lib/gestao/pdi/store"
import { getGestaoProfilesSnapshot } from "@/lib/gestao/profiles-store"
import { getGestaoReportsSnapshot } from "@/lib/gestao/reports-store"
import { getAreaSoftSkillsTemplate } from "@/lib/gestao/soft-skills-template/store"
import { getDirectReports, getOrgSnapshot, listUsersInArea } from "@/lib/org/store"

export function buildAreaExport(areaId: string) {
  const org = getOrgSnapshot()
  const areaUsers = listUsersInArea(areaId)
  const userIds = new Set(areaUsers.map((user) => user.id))

  const pdi = getGestaoPdiSnapshot()
  const profiles = getGestaoProfilesSnapshot()
  const objectives = getGestaoObjectivesSnapshot().filter((objective) =>
    userIds.has(objective.userId)
  )

  return {
    app: "atlas-gestao",
    version: 1,
    scope: "area" as const,
    areaId,
    exportedAt: new Date().toISOString(),
    permissions: getAreaPermissions(areaId),
    softSkillsTemplate: getAreaSoftSkillsTemplate(areaId),
    org: {
      area: org.areas.find((area) => area.id === areaId) ?? null,
      users: areaUsers,
    },
    pdi: {
      frameworks: pdi.frameworks.filter(
        (framework) => !framework.areaId || framework.areaId === areaId
      ),
      assignments: pdi.assignments.filter((assignment) => userIds.has(assignment.userId)),
      promotionRequests: pdi.promotionRequests.filter((request) => request.areaId === areaId),
    },
    profiles: {
      behavioral: profiles.behavioral.filter((entry) => userIds.has(entry.userId)),
      softSkills: profiles.softSkills.filter((entry) => userIds.has(entry.userId)),
    },
    objectives,
    reports: getGestaoReportsSnapshot().filter((report) => userIds.has(report.userId)),
    audit: getAuditForArea(areaId),
  }
}

export function buildManagerExport(managerId: string, areaId: string) {
  const directReports = getDirectReports(managerId)
  const reportIds = new Set(directReports.map((user) => user.id))
  const pdi = getGestaoPdiSnapshot()
  const profiles = getGestaoProfilesSnapshot()
  const objectives = getGestaoObjectivesSnapshot().filter(
    (objective) => objective.managerId === managerId
  )

  return {
    app: "atlas-gestao",
    version: 1,
    scope: "manager" as const,
    areaId,
    managerId,
    exportedAt: new Date().toISOString(),
    liderados: directReports,
    pdi: {
      assignments: pdi.assignments.filter(
        (assignment) =>
          assignment.managerId === managerId && reportIds.has(assignment.userId)
      ),
      promotionRequests: pdi.promotionRequests.filter(
        (request) => request.managerId === managerId
      ),
    },
    profiles: {
      behavioral: profiles.behavioral.filter((entry) => reportIds.has(entry.userId)),
      softSkills: profiles.softSkills.filter((entry) => reportIds.has(entry.userId)),
    },
    objectives,
    reports: getGestaoReportsSnapshot().filter((report) => report.managerId === managerId),
  }
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

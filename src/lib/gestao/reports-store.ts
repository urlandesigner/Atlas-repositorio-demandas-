"use client"

import type { ReportSection, ReportSnapshot } from "@/lib/evolution/types"

export interface GestaoReportSnapshot extends ReportSnapshot {
  userId: string
  managerId: string
}

export const GESTAO_REPORTS_STORAGE_KEY = "atlas_gestao_reports"
export const GESTAO_REPORTS_STORAGE_EVENT = "atlas-gestao-reports-change"

let cached: GestaoReportSnapshot[] | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalize(raw: Partial<GestaoReportSnapshot>): GestaoReportSnapshot | null {
  if (!raw.id || !raw.userId || !raw.managerId || !Array.isArray(raw.sections)) return null
  const now = new Date().toISOString()
  return {
    id: raw.id,
    type: raw.type ?? "one_on_one",
    userId: raw.userId,
    managerId: raw.managerId,
    periodStart: raw.periodStart ?? now,
    periodEnd: raw.periodEnd ?? now,
    sections: raw.sections.map((section) => ({
      id: section.id,
      title: section.title,
      content: section.content ?? "",
      source: section.source ?? "baseline",
      linkedRecordIds: section.linkedRecordIds,
    })),
    generatedAt: raw.generatedAt ?? now,
    lastEditedAt: raw.lastEditedAt ?? now,
  }
}

export function getGestaoReportsSnapshot(): GestaoReportSnapshot[] {
  if (!isClient()) return []
  if (cached) return cached

  const raw = localStorage.getItem(GESTAO_REPORTS_STORAGE_KEY)
  if (!raw) {
    cached = []
    return cached
  }

  try {
    cached = (JSON.parse(raw) as Partial<GestaoReportSnapshot>[])
      .map(normalize)
      .filter((entry): entry is GestaoReportSnapshot => entry !== null)
      .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt))
    return cached
  } catch {
    cached = []
    return cached
  }
}

export function getGestaoReportsServerSnapshot(): GestaoReportSnapshot[] {
  return []
}

function save(data: GestaoReportSnapshot[]) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(GESTAO_REPORTS_STORAGE_KEY, JSON.stringify(data))
}

export function emitGestaoReportsChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(GESTAO_REPORTS_STORAGE_EVENT))
}

export function subscribeGestaoReportsStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(GESTAO_REPORTS_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(GESTAO_REPORTS_STORAGE_EVENT, handler)
  }
}

export function getLatestGestaoReport(userId: string): GestaoReportSnapshot | null {
  return getGestaoReportsSnapshot().find((report) => report.userId === userId) ?? null
}

export function saveGestaoReport(report: GestaoReportSnapshot) {
  const data = getGestaoReportsSnapshot()
  const index = data.findIndex((entry) => entry.id === report.id)
  const next =
    index >= 0
      ? data.map((entry, i) => (i === index ? report : entry))
      : [report, ...data.filter((entry) => entry.userId !== report.userId)]
  save(next.slice(0, 30))
  emitGestaoReportsChange()
}

export function updateGestaoReportSection(
  reportId: string,
  sectionId: string,
  content: string
): GestaoReportSnapshot | null {
  const report = getGestaoReportsSnapshot().find((entry) => entry.id === reportId)
  if (!report) return null

  const updated: GestaoReportSnapshot = {
    ...report,
    lastEditedAt: new Date().toISOString(),
    sections: report.sections.map((section) =>
      section.id === sectionId ? { ...section, content, source: "user" as const } : section
    ),
  }
  saveGestaoReport(updated)
  return updated
}

export function createGestaoReportSnapshot(input: {
  userId: string
  managerId: string
  periodStart: string
  periodEnd: string
  sections: ReportSection[]
}): GestaoReportSnapshot {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    type: "one_on_one",
    userId: input.userId,
    managerId: input.managerId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    sections: input.sections,
    generatedAt: now,
    lastEditedAt: now,
  }
}

"use client"

import type { ReportSnapshot, ReportType } from "./types"

export const REPORTS_STORAGE_KEY = "atlas_evolution_reports"
export const REPORTS_STORAGE_EVENT = "atlas-evolution-reports-change"

let cachedRaw: string | null | undefined
let cachedSnapshot: ReportSnapshot[] = []

function normalizeReport(value: Partial<ReportSnapshot>): ReportSnapshot | null {
  if (!value.id || !value.type || !Array.isArray(value.sections)) return null
  const now = new Date().toISOString()
  return {
    id: value.id,
    type: value.type as ReportType,
    periodStart: value.periodStart || now,
    periodEnd: value.periodEnd || now,
    sections: value.sections.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content ?? "",
      source: s.source ?? "baseline",
      linkedRecordIds: s.linkedRecordIds,
    })),
    generatedAt: value.generatedAt || now,
    lastEditedAt: value.lastEditedAt || now,
    targetRole: value.targetRole,
    targetLevelId: value.targetLevelId,
  }
}

export function getReportsSnapshot(): ReportSnapshot[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY)
    if (raw === cachedRaw) return cachedSnapshot
    const parsed = raw ? (JSON.parse(raw) as Partial<ReportSnapshot>[]) : []
    const snapshot = (Array.isArray(parsed) ? parsed : [])
      .map((item) => normalizeReport(item))
      .filter((item): item is ReportSnapshot => item !== null)
      .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt))
    cachedRaw = raw
    cachedSnapshot = snapshot
    return snapshot
  } catch {
    cachedRaw = null
    cachedSnapshot = []
    return []
  }
}

export function getReportsServerSnapshot(): ReportSnapshot[] {
  return []
}

function save(reports: ReportSnapshot[]): void {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(reports)
  localStorage.setItem(REPORTS_STORAGE_KEY, raw)
  cachedRaw = raw
  cachedSnapshot = reports
}

export function emitReportsChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(REPORTS_STORAGE_EVENT))
}

export function subscribeReportsStore(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key !== REPORTS_STORAGE_KEY) return
    onChange()
  }
  const onLocal = () => onChange()
  window.addEventListener("storage", onStorage)
  window.addEventListener(REPORTS_STORAGE_EVENT, onLocal)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(REPORTS_STORAGE_EVENT, onLocal)
  }
}

export function saveReport(report: ReportSnapshot): void {
  const existing = getReportsSnapshot()
  const idx = existing.findIndex((r) => r.id === report.id)
  const next = idx >= 0 ? existing.map((r, i) => (i === idx ? report : r)) : [report, ...existing]
  save(next.slice(0, 20))
  emitReportsChange()
}

export function getLatestReport(type: ReportType): ReportSnapshot | null {
  return getReportsSnapshot().find((r) => r.type === type) ?? null
}

export function updateReportSection(
  reportId: string,
  sectionId: string,
  content: string
): ReportSnapshot | null {
  const reports = getReportsSnapshot()
  const report = reports.find((r) => r.id === reportId)
  if (!report) return null
  const updated: ReportSnapshot = {
    ...report,
    lastEditedAt: new Date().toISOString(),
    sections: report.sections.map((s) =>
      s.id === sectionId ? { ...s, content, source: "user" as const } : s
    ),
  }
  saveReport(updated)
  return updated
}

"use client"

import { REPORTS_STORAGE_KEY } from "./reports-store"
import type { ReportSnapshot } from "./types"

export interface OneOnOneEntry {
  id: string
  date: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface OneOnOneForm {
  date: string
  notes: string
}

export const ONE_ON_ONE_STORAGE_KEY = "atlas_one_on_one_entries"
export const ONE_ON_ONE_STORAGE_EVENT = "atlas-one-on-one-change"

export const EMPTY_ONE_ON_ONE_FORM: OneOnOneForm = {
  date: new Date().toISOString().slice(0, 10),
  notes: "",
}

let cachedRaw: string | null | undefined
let cachedSnapshot: OneOnOneEntry[] = []

function normalizeEntry(value: Partial<OneOnOneEntry>): OneOnOneEntry | null {
  const date = typeof value.date === "string" ? value.date.slice(0, 10) : ""
  const notes = value.notes?.trim() ?? ""
  if (!date || !notes) return null

  const createdAt = value.createdAt ?? new Date(`${date}T12:00:00`).toISOString()
  return {
    id: value.id ?? crypto.randomUUID(),
    date,
    notes,
    createdAt,
    updatedAt: value.updatedAt ?? createdAt,
  }
}

function sortEntries(entries: OneOnOneEntry[]): OneOnOneEntry[] {
  return [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)
  )
}

function save(entries: OneOnOneEntry[]): void {
  if (typeof window === "undefined") return
  const sorted = sortEntries(entries)
  const raw = JSON.stringify(sorted)
  localStorage.setItem(ONE_ON_ONE_STORAGE_KEY, raw)
  cachedRaw = raw
  cachedSnapshot = sorted
}

function reportToNotes(report: ReportSnapshot): string {
  return report.sections
    .filter((section) => section.content.trim())
    .map((section) => `${section.title}\n${section.content.trim()}`)
    .join("\n\n")
    .trim()
}

function migrateLegacyReports(): OneOnOneEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as Partial<ReportSnapshot>[]
    const reports = (Array.isArray(parsed) ? parsed : []).filter(
      (item): item is ReportSnapshot =>
        Boolean(item?.id) && item?.type === "one_on_one" && Array.isArray(item?.sections)
    )

    const migrated = reports
      .map((report) =>
        normalizeEntry({
          id: report.id,
          date: (report.periodEnd || report.lastEditedAt || report.generatedAt || "").slice(0, 10),
          notes: reportToNotes(report),
          createdAt: report.generatedAt,
          updatedAt: report.lastEditedAt,
        })
      )
      .filter((entry): entry is OneOnOneEntry => entry !== null)

    if (migrated.length) save(migrated)
    return migrated
  } catch {
    return []
  }
}

export function getOneOnOneSnapshot(): OneOnOneEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ONE_ON_ONE_STORAGE_KEY)
    if (!raw) {
      if (cachedRaw === null) return cachedSnapshot
      const migrated = migrateLegacyReports()
      cachedRaw = null
      cachedSnapshot = migrated
      return migrated
    }

    if (raw === cachedRaw) return cachedSnapshot
    const parsed = JSON.parse(raw) as Partial<OneOnOneEntry>[]
    const snapshot = sortEntries(
      (Array.isArray(parsed) ? parsed : [])
        .map((item) => normalizeEntry(item))
        .filter((item): item is OneOnOneEntry => item !== null)
    )
    cachedRaw = raw
    cachedSnapshot = snapshot
    return snapshot
  } catch {
    cachedRaw = null
    cachedSnapshot = []
    return []
  }
}

export function getOneOnOneServerSnapshot(): OneOnOneEntry[] {
  return []
}

export function emitOneOnOneChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(ONE_ON_ONE_STORAGE_EVENT))
}

export function subscribeOneOnOneStore(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== ONE_ON_ONE_STORAGE_KEY) return
    onChange()
  }
  const onLocal = () => onChange()
  window.addEventListener("storage", onStorage)
  window.addEventListener(ONE_ON_ONE_STORAGE_EVENT, onLocal)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(ONE_ON_ONE_STORAGE_EVENT, onLocal)
  }
}

export function createOneOnOneEntry(form: OneOnOneForm): OneOnOneEntry | null {
  return normalizeEntry({
    id: crypto.randomUUID(),
    date: form.date,
    notes: form.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export function createOneOnOneForm(entry: OneOnOneEntry): OneOnOneForm {
  return {
    date: entry.date,
    notes: entry.notes,
  }
}

export function saveOneOnOneEntries(entries: OneOnOneEntry[]): void {
  save(entries)
  emitOneOnOneChange()
}

export function addOneOnOneEntry(
  items: OneOnOneEntry[],
  form: OneOnOneForm
): OneOnOneEntry[] {
  const entry = createOneOnOneEntry(form)
  return entry ? [entry, ...items] : items
}

export function updateOneOnOneEntry(
  items: OneOnOneEntry[],
  entryId: string,
  form: OneOnOneForm
): OneOnOneEntry[] {
  return items.map((item) =>
    item.id === entryId
      ? {
          ...item,
          date: form.date,
          notes: form.notes.trim(),
          updatedAt: new Date().toISOString(),
        }
      : item
  )
}

export function deleteOneOnOneEntry(items: OneOnOneEntry[], entryId: string): OneOnOneEntry[] {
  return items.filter((item) => item.id !== entryId)
}

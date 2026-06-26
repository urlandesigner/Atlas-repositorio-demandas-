"use client"

import type { RecognitionEntry, RecognitionType } from "./types"

export const RECOGNITIONS_STORAGE_KEY = "atlas_recognitions"
export const RECOGNITIONS_STORAGE_EVENT = "atlas-recognitions-change"

let cachedRaw: string | null | undefined
let cachedSnapshot: RecognitionEntry[] = []

function normalizeEntry(value: Partial<RecognitionEntry>): RecognitionEntry | null {
  if (!value.id || !value.title?.trim()) return null
  const now = new Date().toISOString()
  return {
    id: value.id,
    title: value.title.trim(),
    description: value.description?.trim() ?? "",
    recognizedBy: value.recognizedBy?.trim() ?? "",
    recognizerArea: value.recognizerArea?.trim() || undefined,
    date: value.date || now.slice(0, 10),
    type: (value.type as RecognitionType) || "impacto",
    projectId: value.projectId,
    projectName: value.projectName?.trim() || undefined,
    linkedRecordIds: Array.isArray(value.linkedRecordIds) ? value.linkedRecordIds : [],
    evidenceUrl: value.evidenceUrl?.trim() || undefined,
    createdAt: value.createdAt || now,
    updatedAt: value.updatedAt || now,
  }
}

export function getRecognitionsSnapshot(): RecognitionEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECOGNITIONS_STORAGE_KEY)
    if (raw === cachedRaw) return cachedSnapshot
    const parsed = raw ? (JSON.parse(raw) as Partial<RecognitionEntry>[]) : []
    const snapshot = (Array.isArray(parsed) ? parsed : [])
      .map((item) => normalizeEntry(item))
      .filter((item): item is RecognitionEntry => item !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
    cachedRaw = raw
    cachedSnapshot = snapshot
    return snapshot
  } catch {
    cachedRaw = null
    cachedSnapshot = []
    return []
  }
}

export function getRecognitionsServerSnapshot(): RecognitionEntry[] {
  return []
}

function save(entries: RecognitionEntry[]): void {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(entries)
  localStorage.setItem(RECOGNITIONS_STORAGE_KEY, raw)
  cachedRaw = raw
  cachedSnapshot = entries
}

export function emitRecognitionsChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(RECOGNITIONS_STORAGE_EVENT))
}

export function subscribeRecognitionsStore(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key !== RECOGNITIONS_STORAGE_KEY) return
    onChange()
  }
  const onLocal = () => onChange()
  window.addEventListener("storage", onStorage)
  window.addEventListener(RECOGNITIONS_STORAGE_EVENT, onLocal)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(RECOGNITIONS_STORAGE_EVENT, onLocal)
  }
}

export function addRecognition(
  input: Omit<RecognitionEntry, "id" | "createdAt" | "updatedAt">
): RecognitionEntry {
  const now = new Date().toISOString()
  const entry = normalizeEntry({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
  if (!entry) throw new Error("Reconhecimento inválido")
  const next = [entry, ...getRecognitionsSnapshot()]
  save(next)
  emitRecognitionsChange()
  return entry
}

export function updateRecognition(id: string, patch: Partial<RecognitionEntry>): void {
  const now = new Date().toISOString()
  const next = getRecognitionsSnapshot().map((item) => {
    if (item.id !== id) return item
    return normalizeEntry({ ...item, ...patch, id: item.id, updatedAt: now }) ?? item
  })
  save(next)
  emitRecognitionsChange()
}

export function deleteRecognition(id: string): void {
  save(getRecognitionsSnapshot().filter((item) => item.id !== id))
  emitRecognitionsChange()
}

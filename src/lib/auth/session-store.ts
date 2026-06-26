"use client"

import type { AuthSession } from "./types"
import { SESSION_STORAGE_EVENT, SESSION_STORAGE_KEY } from "./session-cookie"

let cachedSession: AuthSession | null | undefined

function isClient() {
  return typeof window !== "undefined"
}

export function getSessionSnapshot(): AuthSession | null {
  if (!isClient()) return null
  if (cachedSession !== undefined) return cachedSession

  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    cachedSession = null
    return null
  }

  try {
    cachedSession = JSON.parse(raw) as AuthSession
    return cachedSession
  } catch {
    cachedSession = null
    return null
  }
}

export function getSessionServerSnapshot(): AuthSession | null {
  return null
}

export function saveSession(session: AuthSession | null) {
  if (!isClient()) return
  cachedSession = session
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

export function emitSessionChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(SESSION_STORAGE_EVENT))
}

export function subscribeSessionStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(SESSION_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(SESSION_STORAGE_EVENT, handler)
  }
}

export function clearSessionCache() {
  cachedSession = undefined
}

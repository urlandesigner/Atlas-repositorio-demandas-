"use client"

import { useSyncExternalStore } from "react"

import {
  getSessionServerSnapshot,
  getSessionSnapshot,
  subscribeSessionStore,
} from "@/lib/auth/session-store"
import type { AuthSession } from "@/lib/auth/types"

export function useOptionalSession(): AuthSession | null {
  return useSyncExternalStore(
    subscribeSessionStore,
    getSessionSnapshot,
    getSessionServerSnapshot
  )
}

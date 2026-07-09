"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { useRouter } from "next/navigation"

import type { AuthSession } from "@/lib/auth/types"
import { getHomeRouteForRole } from "@/lib/auth/routes"
import {
  clearSessionCache,
  emitSessionChange,
  getSessionServerSnapshot,
  getSessionSnapshot,
  saveSession,
  subscribeSessionStore,
} from "@/lib/auth/session-store"

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  /** true depois de hidratar e tentar restaurar a sessão (localStorage/cookie). */
  ready: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isAuthenticated: false,
  ready: false,
  login: async () => ({ error: "AuthProvider ausente" }),
  logout: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useSyncExternalStore(
    subscribeSessionStore,
    getSessionSnapshot,
    getSessionServerSnapshot
  )

  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Sessão já no localStorage — pronto imediatamente.
    if (getSessionSnapshot()) {
      setReady(true)
      return
    }

    // Sem sessão local: tenta restaurar pelo cookie antes de liberar guards.
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((payload: { session?: AuthSession | null }) => {
        if (payload.session) {
          saveSession(payload.session)
          emitSessionChange()
        }
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const payload = (await response.json()) as {
      session?: AuthSession
      error?: string
    }

    if (!response.ok) {
      return { error: payload.error ?? "Não foi possível entrar." }
    }

    if (payload.session) {
      saveSession(payload.session)
      emitSessionChange()
      router.push(getHomeRouteForRole(payload.session.role))
    }

    return {}
  }, [router])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    clearSessionCache()
    saveSession(null)
    emitSessionChange()
    router.push("/login")
  }, [router])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      ready,
      login,
      logout,
    }),
    [session, ready, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

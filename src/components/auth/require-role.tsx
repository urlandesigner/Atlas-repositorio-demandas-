"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { getHomeRouteForRole, roleCanAccessPath } from "@/lib/auth/routes"
import type { UserRole } from "@/lib/org/types"

export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[]
  children: React.ReactNode
}) {
  const { session, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated || !session) {
      router.replace("/login")
      return
    }

    // Autenticado, mas sem permissão para esta rota → manda para a home do papel
    if (!roles.includes(session.role) || !roleCanAccessPath(session.role, pathname)) {
      router.replace(getHomeRouteForRole(session.role))
    }
  }, [isAuthenticated, pathname, roles, router, session])

  if (!session || !roles.includes(session.role)) {
    return null
  }

  if (!roleCanAccessPath(session.role, pathname)) {
    return null
  }

  return children
}

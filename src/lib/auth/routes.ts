import type { UserRole } from "@/lib/org/types"

export function getHomeRouteForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "gestor":
      return "/gestao"
    case "colaborador":
    default:
      return "/dashboard"
  }
}

export function roleCanAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "admin"
  if (pathname.startsWith("/gestao")) return role === "gestor" || role === "admin"
  return true
}

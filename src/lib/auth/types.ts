import type { UserRole } from "@/lib/org/types"

export interface AuthSession {
  userId: string
  email: string
  name: string
  role: UserRole
  areaId: string | null
  issuedAt: string
}

export interface MockCredential {
  email: string
  password: string
  userId: string
}

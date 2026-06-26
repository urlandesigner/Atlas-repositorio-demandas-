import type { MockCredential } from "./types"

/** Credenciais de demonstração — substituir por Supabase Auth depois */
export const MOCK_CREDENTIALS: MockCredential[] = [
  { email: "admin@atlas.com", password: "admin123", userId: "user-admin" },
  { email: "gestor@atlas.com", password: "gestor123", userId: "user-gestor" },
  { email: "colaborador@atlas.com", password: "colab123", userId: "user-colab" },
]

export function findMockCredential(email: string, password: string) {
  const normalized = email.trim().toLowerCase()
  return MOCK_CREDENTIALS.find(
    (entry) => entry.email === normalized && entry.password === password
  )
}

export const DEMO_LOGIN_HINTS = MOCK_CREDENTIALS.map((entry) => ({
  email: entry.email,
  password: entry.password,
}))

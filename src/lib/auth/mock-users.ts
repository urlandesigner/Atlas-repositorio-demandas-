import type { MockCredential } from "./types"

export const DEMO_ACCOUNTS = [
  {
    id: "admin",
    role: "Administrador",
    description: "Configuração da área, PDIs e aprovações",
    email: "admin@atlas.com",
    password: "admin123",
    userId: "user-admin",
  },
  {
    id: "gestor",
    role: "Gestor",
    description: "Acompanhamento do time, 1:1 e objetivos",
    email: "gestor@atlas.com",
    password: "gestor123",
    userId: "user-gestor",
  },
  {
    id: "colaborador",
    role: "Colaborador",
    description: "Registros, evolução e metas pessoais",
    email: "colaborador@atlas.com",
    password: "colab123",
    userId: "user-colab",
  },
] as const

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number]

/** Credenciais de demonstração — substituir por Supabase Auth depois */
export const MOCK_CREDENTIALS: MockCredential[] = DEMO_ACCOUNTS.map(
  ({ email, password, userId }) => ({ email, password, userId })
)

export function findMockCredential(email: string, password: string) {
  const normalized = email.trim().toLowerCase()
  return MOCK_CREDENTIALS.find(
    (entry) => entry.email === normalized && entry.password === password
  )
}

export const DEMO_LOGIN_HINTS = DEMO_ACCOUNTS.map((entry) => ({
  email: entry.email,
  password: entry.password,
}))

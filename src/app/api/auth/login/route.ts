import { NextResponse } from "next/server"

import { findMockCredential } from "@/lib/auth/mock-users"
import type { AuthSession } from "@/lib/auth/types"
import {
  encodeSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie"
import { ORG_SEED } from "@/lib/org/seed"

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string }
  const email = body.email?.trim() ?? ""
  const password = body.password ?? ""

  if (!email || !password) {
    return NextResponse.json({ error: "Informe email e senha." }, { status: 400 })
  }

  const credential = findMockCredential(email, password)
  if (!credential) {
    return NextResponse.json({ error: "Email ou senha inválidos." }, { status: 401 })
  }

  const orgUser = ORG_SEED.users.find((user) => user.id === credential.userId)
  if (!orgUser) {
    return NextResponse.json({ error: "Usuário não encontrado na organização." }, { status: 404 })
  }

  const session: AuthSession = {
    userId: orgUser.id,
    email: orgUser.email,
    name: orgUser.name,
    role: orgUser.role,
    areaId: orgUser.areaId,
    issuedAt: new Date().toISOString(),
  }

  const response = NextResponse.json({ session })
  response.cookies.set(SESSION_COOKIE_NAME, encodeSessionCookie(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}

import { NextResponse, type NextRequest } from "next/server"

import {
  decodeSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie"
import type { AuthSession } from "@/lib/auth/types"

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!cookie) {
    return NextResponse.json({ session: null })
  }

  const session = decodeSessionCookie<AuthSession>(cookie)
  if (!session) {
    return NextResponse.json({ session: null })
  }

  return NextResponse.json({ session })
}

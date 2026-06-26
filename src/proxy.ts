import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import {
  decodeSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie"
import { getHomeRouteForRole } from "@/lib/auth/routes"
import type { AuthSession } from "@/lib/auth/types"

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // TODO: remover quando Supabase estiver configurado
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const mockCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const mockSession = mockCookie
    ? decodeSessionCookie<AuthSession>(mockCookie)
    : null

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")

  const effectiveUser = user ?? mockSession

  if (!effectiveUser && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (effectiveUser && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = mockSession
      ? getHomeRouteForRole(mockSession.role)
      : "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

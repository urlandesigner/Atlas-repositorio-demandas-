import Link from "next/link"

import { LoginForm } from "@/components/auth/login-form"
import { LoginHeroPanel } from "@/components/auth/login-hero-panel"
import { AuthProvider } from "@/components/auth/auth-provider"

function AtlasLogo() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand shadow-[0_8px_20px_color-mix(in_srgb,var(--color-brand)_24%,transparent)]">
      <span className="text-sm font-bold tracking-tight text-brand-foreground">A</span>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="grid min-h-dvh bg-white lg:grid-cols-[45%_minmax(0,1fr)]">
        <div className="hidden bg-white lg:flex lg:min-h-dvh lg:w-full lg:p-4">
          <LoginHeroPanel />
        </div>

        <div className="flex min-h-dvh flex-col bg-white">
          <main className="flex flex-1 items-center justify-center px-6 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-[26rem] space-y-8">
              <div className="space-y-3">
                <AtlasLogo />
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Bem-vindo ao Atlas
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Entre com seu e-mail corporativo para acessar sua conta.
                  </p>
                </div>
              </div>

              <LoginForm />
            </div>
          </main>

          <footer className="flex flex-col gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12 xl:px-16">
            <span>© 2026 YberaGroup</span>
            <div className="flex items-center gap-4">
              <Link href="#" className="transition-colors hover:text-foreground">
                Privacidade
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground">
                Suporte
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </AuthProvider>
  )
}

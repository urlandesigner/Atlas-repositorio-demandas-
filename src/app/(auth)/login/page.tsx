import { LoginForm } from "@/components/auth/login-form"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="grid min-h-screen bg-background lg:grid-cols-2">
        <div className="relative hidden overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_32%),linear-gradient(160deg,#5060f4_0%,#3a4adf_46%,#2f3fc3_100%)] lg:flex lg:min-h-screen lg:items-center lg:px-16 xl:px-24">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="relative w-full max-w-lg space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72">
              Workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Entre para acompanhar objetivos, evolução e rituais do time.
            </h1>
            <p className="text-base leading-7 text-white/78">
              Um único lugar para registrar entregas, acompanhar PDIs, organizar 1:1 e dar
              visibilidade ao desenvolvimento de cada pessoa.
            </p>
          </div>
        </div>

        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
          <div className="w-full max-w-md space-y-10">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand">
                <span className="text-base font-bold text-brand-foreground">A</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight text-foreground">Atlas</p>
                <p className="text-sm text-muted-foreground">
                  Acompanhamento de carreira e gestão
                </p>
              </div>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}

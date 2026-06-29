import Image from "next/image"

import { LoginForm } from "@/components/auth/login-form"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="grid min-h-screen bg-white lg:grid-cols-[45%_minmax(0,1fr)]">
        <div className="hidden bg-white lg:flex lg:min-h-screen lg:p-5">
          <div className="relative flex w-full flex-col overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_32%),linear-gradient(160deg,#5060f4_0%,#3a4adf_46%,#2f3fc3_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%)]" />
            <div className="relative z-10 flex min-h-full flex-col justify-between px-12 pt-12 pb-16 xl:px-16 xl:pt-12 xl:pb-20">
              <Image
                src="/images/yberagroup.svg"
                alt="YberaGroup"
                width={189}
                height={20}
                className="h-5 w-auto self-start"
                priority
              />
              <div className="w-full max-w-lg space-y-4">
                <h1 className="text-[2.35rem] font-semibold leading-[1.12] tracking-tight text-white">
                  Evolução profissional, com método.
                </h1>
                <p className="max-w-md text-base leading-7 text-white/78">
                  PDIs, objetivos e registros em ambiente confidencial.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
          <div className="w-full max-w-[26rem] space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand shadow-[0_8px_24px_rgba(58,74,223,0.28)]">
                <span className="text-base font-bold text-brand-foreground">A</span>
              </div>
              <p className="text-xl font-semibold tracking-tight text-foreground">Atlas</p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}

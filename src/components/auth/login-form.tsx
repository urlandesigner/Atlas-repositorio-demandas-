"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { DEMO_ACCOUNTS, type DemoAccount } from "@/lib/auth/mock-users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const inputClassName =
  "h-11 border-border/70 bg-white px-4 text-[15px] transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/12"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null)

  async function submitCredentials(nextEmail: string, nextPassword: string) {
    setError(null)
    setLoading(true)

    const result = await login(nextEmail, nextPassword)
    if (result.error) {
      setError(result.error)
    }

    setLoading(false)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    await submitCredentials(email, password)
  }

  async function enterAsDemo(account: DemoAccount) {
    setEmail(account.email)
    setPassword(account.password)
    setActiveDemoId(account.id)
    await submitCredentials(account.email, account.password)
  }

  return (
    <div className="w-full">
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground/90" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@atlas.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground/90" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              required
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <Button className="mt-6 h-11 w-full" type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="mt-5">
        <p className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Acesso rápido
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => {
            const isActive = activeDemoId === account.id
            return (
              <button
                key={account.id}
                type="button"
                title={account.description}
                disabled={loading}
                onClick={() => enterAsDemo(account)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center text-xs font-medium transition-colors",
                  isActive
                    ? "border-brand/30 bg-brand-muted/40 text-brand-muted-foreground"
                    : "border-border/60 bg-muted/30 text-foreground hover:border-border hover:bg-muted/50"
                )}
              >
                {account.role}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

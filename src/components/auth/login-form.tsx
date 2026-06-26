"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { DEMO_LOGIN_HINTS } from "@/lib/auth/mock-users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const result = await login(email, password)
    if (result.error) {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <Card className="gap-0 border-border/60 bg-card/96 py-0 shadow-[0_18px_48px_rgba(38,37,30,0.08)]">
      <CardHeader className="space-y-1 border-0 px-6 pt-6 pb-0">
        <CardTitle className="text-2xl font-semibold tracking-tight">Entrar na sua conta</CardTitle>
        <CardDescription>
          Use uma conta demo para acessar o workspace de acompanhamento.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pt-5 pb-6">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@atlas.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="password">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-[10px] border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 rounded-[14px] border border-dashed border-border/70 bg-muted/25 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Contas demo
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {DEMO_LOGIN_HINTS.map((entry) => (
              <li key={entry.email}>
                <button
                  type="button"
                  className="text-left transition-colors hover:text-foreground hover:underline"
                  onClick={() => {
                    setEmail(entry.email)
                    setPassword(entry.password)
                  }}
                >
                  {entry.email} · {entry.password}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

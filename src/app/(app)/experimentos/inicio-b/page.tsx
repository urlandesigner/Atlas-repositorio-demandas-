"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useEvolutionData } from "@/hooks/use-evolution-data"
import { useHrNotices } from "@/hooks/use-hr-notices"
import { levelIndex } from "@/lib/profile/store"
import {
  getKudosReceived,
  getOrgSocialServerSnapshot,
  getOrgSocialSnapshot,
  KUDO_TYPE_META,
  subscribeOrgSocialStore,
} from "@/lib/org/social"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
import { OBJECTIVE_STATUS_LABEL } from "@/lib/objectives/store"
import { cn, formatListDate } from "@/lib/utils"

/**
 * EXPERIMENTO — não é a Início de produção.
 *
 * Clone da home do colaborador com outra direção visual, para julgar a direção
 * com dados reais antes de decidir. Fica isolado de propósito:
 *
 * - não importa `components/ui`: os primitivos daqui vivem neste arquivo, então
 *   nenhum ajuste feito para o experimento vaza para as 37 rotas do app
 * - as cores pastel são valores literais com par claro/escuro, não tokens; se a
 *   direção for adotada, é aí que elas viram token
 * - os dados vêm dos mesmos hooks da Início de produção, sem mock
 *
 * A rota é /experimentos/inicio-b e não está na navegação lateral.
 */

/** Pastel do experimento: par claro/escuro, porque o app tem os dois temas. */
const PASTEIS = {
  menta: "bg-[#D9F2E3] text-[#123524] dark:bg-[#132A20] dark:text-[#A7E0C0]",
  ceu: "bg-[#D6EBFB] text-[#0F2A3D] dark:bg-[#13232F] dark:text-[#A2CFEC]",
  pessego: "bg-[#FBE3CB] text-[#3D2410] dark:bg-[#2E2117] dark:text-[#E8BE93]",
  lavanda: "bg-[#DFDCFA] text-[#221E4A] dark:bg-[#1E1C31] dark:text-[#BEB7F0]",
} as const

function CartaoPastel({
  rotulo,
  valor,
  sufixo,
  apoio,
  cor,
}: {
  rotulo: string
  valor: string | number
  sufixo?: string
  apoio: string
  cor: keyof typeof PASTEIS
}) {
  return (
    <div className={cn("rounded-[22px] px-5 py-5 text-center", PASTEIS[cor])}>
      <p className="text-2xs font-semibold tracking-[0.1em] uppercase opacity-70">
        {rotulo}
      </p>
      <p className="mt-2 text-[34px] leading-none font-semibold tracking-tight">
        {valor}
        {sufixo ? <span className="ml-0.5 text-base font-medium opacity-60">{sufixo}</span> : null}
      </p>
      <p className="mt-2 text-2xs opacity-70">{apoio}</p>
    </div>
  )
}

/** Chip de contorno arredondado — o metadado da referência. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-black/10 bg-white px-3 text-2xs font-medium text-neutral-700 dark:border-white/12 dark:bg-white/5 dark:text-neutral-300">
      {children}
    </span>
  )
}

/** Pílula segmentada com o ativo em preenchimento cheio. */
function Abas({
  valor,
  onChange,
  opcoes,
}: {
  valor: string
  onChange: (v: string) => void
  opcoes: { id: string; rotulo: string; contagem: number }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const ativo = o.id === valor
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors",
              ativo
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
            )}
          >
            {o.rotulo}
            <span className={cn("text-2xs", ativo ? "opacity-60" : "opacity-50")}>
              {o.contagem}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Bloco({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[22px] bg-white p-6 dark:bg-white/[0.04]",
        className
      )}
    >
      {children}
    </div>
  )
}

export default function InicioExperimentoPage() {
  const { session } = useAuth()
  const { records, objectives, readiness, profile, openCapture } = useEvolutionData()
  const { notices } = useHrNotices(3)
  const social = useSyncExternalStore(
    subscribeOrgSocialStore,
    getOrgSocialSnapshot,
    getOrgSocialServerSnapshot
  )
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)

  const [aba, setAba] = useState("movimentacoes")

  const ativos = objectives.filter((o) => o.status === "in_progress" || o.status === "planned")
  const doMes = records.filter((r) => {
    const d = new Date(r.createdAt)
    const hoje = new Date()
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()
  })
  const kudos = session ? getKudosReceived(social, session.userId) : []
  const nomePor = useMemo(
    () => new Map(org.users.map((u) => [u.id, u.name])),
    [org.users]
  )

  const nivelAtual = profile.ladder[levelIndex(profile.ladder, profile.identity.levelId)]
  const nivelMeta = profile.goal.targetLevelId
    ? profile.ladder[levelIndex(profile.ladder, profile.goal.targetLevelId)]
    : undefined
  const indiceAtual = levelIndex(profile.ladder, profile.identity.levelId)

  const primeiroNome = session?.name?.trim().split(" ")[0] ?? ""

  return (
    <div className="-m-4 min-h-full bg-neutral-100 p-6 dark:bg-neutral-950 sm:-m-6 sm:p-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-neutral-900 dark:text-white">
              Bem-vindo de volta, {primeiroNome}! <span aria-hidden>🔥</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              O que está em andamento, o que virou evidência e onde vale focar agora.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCapture()}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <Sparkles className="size-4" />
            Registrar progresso
          </button>
        </header>

        {/* A fileira pastel é o gesto que define a direção. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CartaoPastel
            cor="menta"
            rotulo="Registros"
            valor={doMes.length}
            apoio={`${records.length} no histórico`}
          />
          <CartaoPastel
            cor="ceu"
            rotulo="Objetivos"
            valor={ativos.length}
            apoio={`${objectives.length} no ciclo`}
          />
          <CartaoPastel
            cor="pessego"
            rotulo="Prontidão"
            valor={Math.round(readiness)}
            sufixo="%"
            apoio={nivelMeta ? `para ${nivelMeta.name}` : "no nível atual"}
          />
          <CartaoPastel
            cor="lavanda"
            rotulo="Elogios"
            valor={kudos.length}
            apoio="recebidos de colegas"
          />
        </div>

        <Bloco>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-2xs font-semibold tracking-[0.1em] uppercase text-neutral-400">
                Trilha de carreira
              </p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                {nivelAtual?.name}
                {nivelMeta ? (
                  <span className="text-neutral-400"> → {nivelMeta.name}</span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip>{profile.identity.role}</Chip>
              {profile.goal.targetYear ? <Chip>meta {profile.goal.targetYear}</Chip> : null}
              <Chip>{records.length} evidências</Chip>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            {profile.ladder.map((nivel, i) => (
              <div key={nivel.id} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
                <div className="flex min-w-0 flex-col items-center gap-2">
                  <span
                    className={cn(
                      "size-3 shrink-0 rounded-full",
                      i <= indiceAtual
                        ? "bg-neutral-900 dark:bg-white"
                        : "bg-neutral-200 dark:bg-white/15"
                    )}
                  />
                  <span
                    className={cn(
                      "w-full truncate text-center text-2xs",
                      i === indiceAtual
                        ? "font-semibold text-neutral-900 dark:text-white"
                        : "text-neutral-400"
                    )}
                  >
                    {nivel.name}
                  </span>
                </div>
                {i < profile.ladder.length - 1 ? (
                  <span
                    className={cn(
                      "mb-5 h-px min-w-3 flex-1",
                      i < indiceAtual ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-white/12"
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </Bloco>

        <Abas
          valor={aba}
          onChange={setAba}
          opcoes={[
            { id: "movimentacoes", rotulo: "Objetivos do ciclo", contagem: ativos.length },
            { id: "elogios", rotulo: "Elogios de colegas", contagem: kudos.length },
            { id: "avisos", rotulo: "Avisos do RH", contagem: notices.length },
          ]}
        />

        <Bloco className="p-0">
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
            {aba === "movimentacoes" &&
              (ativos.length ? (
                ativos.map((o) => (
                  <Link
                    key={o.id}
                    href="/professional/objectives"
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-neutral-900 dark:text-white">
                        {o.title}
                      </p>
                      <p className="mt-1 text-2xs text-neutral-500 dark:text-neutral-400">
                        {OBJECTIVE_STATUS_LABEL[o.status]}
                        {o.deadline ? ` · prazo ${formatListDate(o.deadline)}` : ""}
                      </p>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-neutral-400" />
                  </Link>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-sm text-neutral-500">
                  Nenhum objetivo ativo no ciclo.
                </p>
              ))}

            {aba === "elogios" &&
              (kudos.length ? (
                kudos.map((k) => {
                  const meta = KUDO_TYPE_META[k.type]
                  return (
                    <div key={k.id} className="flex gap-4 px-6 py-5">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-base dark:bg-white/10"
                      >
                        {meta.emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[15px] font-semibold text-neutral-900 dark:text-white">
                            {nomePor.get(k.fromUserId) ?? "Ex-colaborador"}
                          </p>
                          <Chip>{meta.label}</Chip>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {k.message}
                        </p>
                        <p className="mt-2 text-2xs text-neutral-400">
                          {formatListDate(k.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="px-6 py-8 text-center text-sm text-neutral-500">
                  Nenhum elogio recebido ainda.
                </p>
              ))}

            {aba === "avisos" &&
              (notices.length ? (
                notices.map((n) => (
                  <div key={n.id} className="px-6 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip>{n.category}</Chip>
                      <span className="text-2xs text-neutral-400">
                        {formatListDate(n.publishedAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-[15px] font-semibold text-neutral-900 dark:text-white">
                      {n.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {n.body}
                    </p>
                  </div>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-sm text-neutral-500">
                  Nenhum aviso publicado.
                </p>
              ))}
          </div>
        </Bloco>

        <p className="text-center text-2xs text-neutral-400">
          Rota de experimento · nenhum componente compartilhado foi alterado
        </p>
      </div>
    </div>
  )
}

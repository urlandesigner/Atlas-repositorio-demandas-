"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Sparkles, Target, Zap } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useEvolutionData } from "@/hooks/use-evolution-data"
import { useHrNotices } from "@/hooks/use-hr-notices"
import { getRecordImpactText } from "@/lib/records/display"
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
import {
  getProjectsServerSnapshot,
  getProjectsSnapshot,
  STATUS_LABEL,
  subscribeProjectsStore,
  TAB_LABEL,
  type ProjectEntry,
  type WorkspaceTab,
} from "@/lib/projects/store"
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
 * Paridade de conteúdo: os oito blocos da Início real, na mesma ordem e com os
 * mesmos limites — avisos do RH (3), foco do ciclo (4, por prazo), elogios (3),
 * os dois KPIs, a trilha, últimas movimentações (5), projetos recentes (4),
 * apresentações (3 + as duas contagens) e o guia de fluxo quando não há
 * registro. A primeira versão deste arquivo tinha só três blocos virados em
 * abas, o que era reinterpretação, não clone.
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
      <p className="text-2xs font-semibold tracking-[0.1em] uppercase opacity-70">{rotulo}</p>
      <p className="mt-2 text-[34px] leading-none font-semibold tracking-tight">
        {valor}
        {sufixo ? <span className="ml-0.5 text-base font-medium opacity-60">{sufixo}</span> : null}
      </p>
      <p className="mt-2 text-2xs opacity-70">{apoio}</p>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-black/10 bg-white px-3 text-2xs font-medium text-neutral-700 dark:border-white/12 dark:bg-white/5 dark:text-neutral-300">
      {children}
    </span>
  )
}

function Bloco({
  children,
  className,
  semPadding = false,
}: {
  children: React.ReactNode
  className?: string
  semPadding?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-[22px] bg-white dark:bg-white/[0.04]",
        semPadding ? "" : "p-6",
        className
      )}
    >
      {children}
    </div>
  )
}

function CabecaDoBloco({
  titulo,
  contagem,
  acao,
}: {
  titulo: string
  contagem?: number
  acao?: { rotulo: string; href: string }
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 px-6 pt-6">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
          {titulo}
        </h2>
        {typeof contagem === "number" ? (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-neutral-100 px-2 text-2xs font-medium text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
            {contagem}
          </span>
        ) : null}
      </div>
      {acao ? (
        <Link
          href={acao.href}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-neutral-100 px-4 text-2xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
        >
          {acao.rotulo}
          <ArrowUpRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  )
}

/** Linha de lista do experimento: badge, título, texto, data — a ordem do app. */
function Linha({
  badges,
  titulo,
  texto,
  data,
  icone,
  href,
}: {
  badges?: React.ReactNode
  titulo: React.ReactNode
  texto?: React.ReactNode
  data?: React.ReactNode
  icone?: React.ReactNode
  href?: string
}) {
  const corpo = (
    <div className="px-6 py-4">
      {icone || badges ? (
        <div className="flex min-h-6 flex-wrap items-center gap-2">
          {icone}
          {badges}
        </div>
      ) : null}
      <p
        className={cn(
          "line-clamp-2 text-[15px] font-semibold text-neutral-900 dark:text-white",
          (icone || badges) && "mt-2"
        )}
      >
        {titulo}
      </p>
      {texto ? (
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-neutral-500 dark:text-neutral-400">
          {texto}
        </p>
      ) : null}
      {data ? (
        <p className="mt-2.5 font-mono text-2xs leading-none font-medium tracking-[0.08em] uppercase text-neutral-400">
          {data}
        </p>
      ) : null}
    </div>
  )

  if (!href) return corpo
  return (
    <Link href={href} className="block transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
      {corpo}
    </Link>
  )
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-6 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
      {children}
    </p>
  )
}

function achatarProjetos(projetos: Record<WorkspaceTab, ProjectEntry[]>) {
  return (Object.keys(projetos) as WorkspaceTab[]).flatMap((w) =>
    projetos[w].map((p) => ({ ...p, workspace: w }))
  )
}

function diasAte(prazo: string | null) {
  if (!prazo) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(`${prazo}T00:00:00`).getTime() - hoje.getTime()) / 86400000)
}

export default function InicioExperimentoPage() {
  const { session } = useAuth()
  const { records, objectives, presentations, readiness, profile, openCapture } =
    useEvolutionData()
  const { notices } = useHrNotices(3)
  const social = useSyncExternalStore(
    subscribeOrgSocialStore,
    getOrgSocialSnapshot,
    getOrgSocialServerSnapshot
  )
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const projetos = useSyncExternalStore(
    subscribeProjectsStore,
    getProjectsSnapshot,
    getProjectsServerSnapshot
  )

  const todosProjetos = useMemo(() => achatarProjetos(projetos), [projetos])
  const projetosAtivos = todosProjetos.filter((p) => p.status === "active")
  const projetosRecentes = useMemo(
    () =>
      [...todosProjetos]
        .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
        .slice(0, 4),
    [todosProjetos]
  )

  const objetivosAtivos = objectives.filter(
    (o) => o.status === "in_progress" || o.status === "planned"
  )
  const focoDoCiclo = useMemo(
    () =>
      [...objetivosAtivos]
        .sort(
          (a, b) =>
            (diasAte(a.deadline) ?? Number.POSITIVE_INFINITY) -
            (diasAte(b.deadline) ?? Number.POSITIVE_INFINITY)
        )
        .slice(0, 4),
    [objetivosAtivos]
  )

  const registrosDoMes = records.filter((r) => {
    const d = new Date(r.createdAt)
    const hoje = new Date()
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()
  })

  const movimentacoes = useMemo(() => {
    const deRegistros = records.slice(0, 4).map((r) => ({
      id: `record-${r.id}`,
      titulo: r.enriched.title,
      texto: getRecordImpactText(r) || r.raw,
      href: "/professional/timeline",
      data: r.updatedAt || r.createdAt,
      rotulo: "Registro",
      Icone: Zap,
    }))
    const deObjetivos = objectives.slice(0, 4).map((o) => ({
      id: `objective-${o.id}`,
      titulo: o.title,
      texto: o.motivation ?? o.title,
      href: "/professional/objectives",
      data: o.updated_at || o.created_at,
      rotulo: "Objetivo",
      Icone: Target,
    }))
    return [...deRegistros, ...deObjetivos]
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 5)
  }, [records, objectives])

  const kudos = session ? getKudosReceived(social, session.userId) : []
  const nomePor = useMemo(() => new Map(org.users.map((u) => [u.id, u.name])), [org.users])

  const realizadas = presentations.filter((p) => p.status === "done")
  const agendadas = presentations.filter((p) => p.status === "scheduled")

  const indiceAtual = levelIndex(profile.ladder, profile.identity.levelId)
  const nivelAtual = profile.ladder[indiceAtual]
  const nivelMeta = profile.goal.targetLevelId
    ? profile.ladder[levelIndex(profile.ladder, profile.goal.targetLevelId)]
    : undefined
  const primeiroNome = session?.name?.trim().split(" ")[0] ?? ""

  return (
    <div className="-m-4 min-h-full bg-neutral-100 p-6 dark:bg-neutral-950 sm:-m-6 sm:p-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight text-neutral-900 dark:text-white">
              Olá, {primeiroNome} <span aria-hidden>🔥</span>
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

        {/* A fileira pastel é o gesto que define a direção. Ela carrega os dois
            KPIs da Início mais a prontidão e a contagem de elogios — que na
            produção vivem dentro da Trilha e do card de elogios. Nada some e
            nada duplica: o bloco da Trilha abaixo mantém o trilho, sem repetir
            o número. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CartaoPastel
            cor="menta"
            rotulo="Registros este mês"
            valor={registrosDoMes.length}
            apoio={`${records.length} no histórico`}
          />
          <CartaoPastel
            cor="ceu"
            rotulo="Objetivos ativos"
            valor={objetivosAtivos.length}
            apoio={`${objectives.filter((o) => o.status === "done").length} concluídos`}
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

        {/* Fileira de abertura da Início: avisos, foco do ciclo, elogios. */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Bloco semPadding>
            <CabecaDoBloco
              titulo="Avisos do RH"
              contagem={notices.length}
              acao={{ rotulo: "Ver todos", href: "/avisos" }}
            />
            <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {notices.length ? (
                notices.map((n) => (
                  <Linha
                    key={n.id}
                    badges={<Chip>{n.category}</Chip>}
                    titulo={n.title}
                    texto={n.body}
                    data={formatListDate(n.publishedAt)}
                  />
                ))
              ) : (
                <Vazio>Nenhum aviso do RH no momento.</Vazio>
              )}
            </div>
          </Bloco>

          <Bloco semPadding>
            <CabecaDoBloco
              titulo="Foco do ciclo"
              acao={{ rotulo: "Objetivos", href: "/professional/objectives" }}
            />
            <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {focoDoCiclo.length ? (
                focoDoCiclo.map((o) => {
                  const dias = diasAte(o.deadline)
                  return (
                    <Linha
                      key={o.id}
                      href="/professional/objectives"
                      badges={<Chip>{OBJECTIVE_STATUS_LABEL[o.status]}</Chip>}
                      titulo={o.title}
                      data={
                        <span className={dias !== null && dias < 0 ? "text-red-500" : undefined}>
                          {dias === null
                            ? "Sem prazo"
                            : dias < 0
                              ? `${Math.abs(dias)}d atraso`
                              : `${dias}d`}
                        </span>
                      }
                    />
                  )
                })
              ) : (
                <Vazio>Nenhum objetivo ativo. Escolha o que quer avançar neste ciclo.</Vazio>
              )}
            </div>
          </Bloco>

          <Bloco semPadding>
            <CabecaDoBloco
              titulo="Elogios de colegas"
              acao={
                session ? { rotulo: "Ver todos", href: `/people/${session.userId}` } : undefined
              }
            />
            <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {kudos.length ? (
                kudos.slice(0, 3).map((k) => {
                  const meta = KUDO_TYPE_META[k.type]
                  return (
                    <Linha
                      key={k.id}
                      icone={
                        <span
                          aria-hidden
                          className="flex size-6 items-center justify-center rounded-full bg-neutral-100 text-[13px] dark:bg-white/10"
                        >
                          {meta.emoji}
                        </span>
                      }
                      badges={<Chip>{meta.label}</Chip>}
                      titulo={nomePor.get(k.fromUserId) ?? "Ex-colaborador"}
                      texto={k.message}
                      data={formatListDate(k.createdAt)}
                    />
                  )
                })
              ) : (
                <Vazio>Nenhum elogio por aqui ainda.</Vazio>
              )}
            </div>
          </Bloco>
        </div>

        {/* Trilha de carreira — o trilho e as saídas. */}
        <Bloco>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-2xs font-semibold tracking-[0.1em] uppercase text-neutral-400">
                Trilha de carreira
              </p>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                {nivelAtual?.name}
                {nivelMeta ? <span className="text-neutral-400"> → {nivelMeta.name}</span> : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip>{profile.identity.role}</Chip>
              {profile.goal.targetYear ? <Chip>meta {profile.goal.targetYear}</Chip> : null}
              <Chip>
                {records.length === 1 ? "1 evidência" : `${records.length} evidências`}
              </Chip>
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
                      i < indiceAtual
                        ? "bg-neutral-900 dark:bg-white"
                        : "bg-neutral-200 dark:bg-white/12"
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-400">
            {records.length === 0
              ? "Registre entregas para construir evidência para o próximo nível."
              : `${records.length} ${records.length === 1 ? "evidência sustenta" : "evidências sustentam"} sua evolução.`}
            {nivelMeta && profile.goal.targetYear
              ? ` Meta: ${profile.goal.targetRole ?? nivelMeta.name} até ${profile.goal.targetYear}.`
              : ""}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/professional/evolution"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Ver evolução
            </Link>
            <Link
              href="/professional/evolution/promotion"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 px-5 text-sm font-medium text-neutral-700 transition-colors hover:bg-black/[0.03] dark:border-white/12 dark:text-neutral-200 dark:hover:bg-white/5"
            >
              Montar dossiê
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </Bloco>

        {/* Feed em dois terços, projetos e apresentações no terço restante. */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Bloco semPadding className="lg:col-span-2">
            <CabecaDoBloco
              titulo="Últimas movimentações"
              acao={{ rotulo: "Ver registros", href: "/professional/timeline" }}
            />
            <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {movimentacoes.length ? (
                movimentacoes.map((m) => (
                  <Linha
                    key={m.id}
                    href={m.href}
                    icone={
                      <span className="flex size-6 items-center justify-center rounded-lg bg-neutral-100 dark:bg-white/10">
                        <m.Icone className="size-3.5 text-neutral-500 dark:text-neutral-300" />
                      </span>
                    }
                    badges={<Chip>{m.rotulo}</Chip>}
                    titulo={m.titulo}
                    texto={m.texto}
                    data={formatListDate(m.data)}
                  />
                ))
              ) : (
                <Vazio>Ainda sem registros nem objetivos.</Vazio>
              )}
            </div>
          </Bloco>

          <div className="flex flex-col gap-4">
            <Bloco semPadding>
              <CabecaDoBloco titulo="Projetos recentes" contagem={projetosRecentes.length} />
              <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {projetosRecentes.length ? (
                  projetosRecentes.map((p) => (
                    <Linha
                      key={`${p.workspace}-${p.id}`}
                      href={`/projects/${p.workspace}/${p.id}`}
                      badges={<Chip>{STATUS_LABEL[p.status]}</Chip>}
                      titulo={p.name}
                      texto={TAB_LABEL[p.workspace]}
                    />
                  ))
                ) : (
                  <Vazio>Nenhum projeto cadastrado.</Vazio>
                )}
              </div>
            </Bloco>

            <Bloco semPadding>
              <CabecaDoBloco titulo="Apresentações" />
              <div className="mt-4 grid grid-cols-2 gap-3 px-6">
                <div className="rounded-[16px] bg-neutral-100 px-4 py-3 dark:bg-white/[0.06]">
                  <p className="text-2xs font-semibold tracking-[0.1em] uppercase text-neutral-400">
                    Realizadas
                  </p>
                  <p className="mt-1.5 text-2xl leading-none font-semibold text-neutral-900 dark:text-white">
                    {realizadas.length}
                  </p>
                </div>
                <div className="rounded-[16px] bg-neutral-100 px-4 py-3 dark:bg-white/[0.06]">
                  <p className="text-2xs font-semibold tracking-[0.1em] uppercase text-neutral-400">
                    Agendadas
                  </p>
                  <p className="mt-1.5 text-2xl leading-none font-semibold text-neutral-900 dark:text-white">
                    {agendadas.length}
                  </p>
                </div>
              </div>
              <div className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {presentations.length ? (
                  presentations.slice(0, 3).map((p) => (
                    <Linha
                      key={p.id}
                      href="/professional/presentations"
                      titulo={p.title}
                      texto={p.sharedWith || undefined}
                      data={p.date ? formatListDate(p.date) : undefined}
                    />
                  ))
                ) : (
                  <Vazio>Nenhuma apresentação registrada ainda.</Vazio>
                )}
              </div>
            </Bloco>
          </div>
        </div>

        {/* Guia de fluxo — só quando não há nenhum registro, como na produção. */}
        {records.length === 0 ? (
          <Bloco>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-2xs font-semibold tracking-[0.1em] uppercase text-neutral-400">
                  Seu fluxo no Atlas
                </p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                  Do trabalho à evidência
                </h2>
              </div>
              <p className="max-w-md text-sm text-neutral-500 sm:text-right dark:text-neutral-400">
                Escolha onde está atuando, registre o que avançou e acompanhe tudo em um só
                histórico.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              <div className="rounded-[18px] bg-neutral-50 p-5 dark:bg-white/[0.04]">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  1 · Escolha o contexto
                </p>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Organize seu trabalho antes de registrar o avanço.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/projects">
                    <Chip>{projetosAtivos.length} projeto(s)</Chip>
                  </Link>
                  <Link href="/professional/objectives">
                    <Chip>{objetivosAtivos.length} objetivo(s)</Chip>
                  </Link>
                </div>
              </div>

              <div className="hidden items-center justify-center md:flex">
                <ArrowRight className="size-4 text-neutral-300 dark:text-neutral-600" />
              </div>

              <button
                type="button"
                onClick={() => openCapture()}
                className="rounded-[18px] bg-neutral-900 p-5 text-left transition-colors hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200"
              >
                <p className="text-sm font-semibold text-white dark:text-neutral-900">
                  2 · Registre o progresso
                </p>
                <p className="mt-1.5 text-sm text-white/70 dark:text-neutral-600">
                  Conte o que avançou. Projeto e objetivo podem ser vinculados na mesma ação.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white dark:text-neutral-900">
                  Criar registro
                  <ArrowRight className="size-3.5" />
                </span>
              </button>

              <div className="hidden items-center justify-center md:flex">
                <ArrowRight className="size-4 text-neutral-300 dark:text-neutral-600" />
              </div>

              <Link
                href="/professional/timeline"
                className="rounded-[18px] bg-neutral-50 p-5 transition-colors hover:bg-neutral-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                  3 · Acompanhe os registros
                  <ArrowUpRight className="size-3.5 text-neutral-400" />
                </p>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {records.length === 0
                    ? "Nenhuma evidência no histórico ainda."
                    : `${records.length} evidências já fazem parte do seu histórico.`}
                </p>
              </Link>
            </div>
          </Bloco>
        ) : null}

        <p className="text-center text-2xs text-neutral-400">
          Rota de experimento · nenhum componente compartilhado foi alterado
        </p>
      </div>
    </div>
  )
}

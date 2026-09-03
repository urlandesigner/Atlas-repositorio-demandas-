"use client"

import { useDeferredValue, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowUpRight, Search, Sparkles } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { MyNetworkCard } from "@/components/people/my-network-card"
import { PageHeader } from "@/components/ui/page-header"
import { PersonAvatar } from "@/components/ui/person-avatar"
import { buildOrgPublicSearchText, getOrgPublicPerson } from "@/lib/org/public"
import {
  countKudosReceived,
  getOrgSocialServerSnapshot,
  getOrgSocialSnapshot,
  getPersonCoverClassName,
  getSocialProfile,
  KUDO_TYPE_META,
  subscribeOrgSocialStore,
} from "@/lib/org/social"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
import { cn } from "@/lib/utils"

function formatKudoDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(iso)
  )
}

export function PeopleDirectory() {
  const { session } = useAuth()
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const social = useSyncExternalStore(
    subscribeOrgSocialStore,
    getOrgSocialSnapshot,
    getOrgSocialServerSnapshot
  )
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const people = [...org.users]
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((user) => ({
      user,
      person: getOrgPublicPerson(org, user),
      profile: getSocialProfile(social, user.id),
      kudosCount: countKudosReceived(social, user.id),
    }))

  const filtered = normalizedQuery
    ? people.filter(({ person, profile }) =>
        [
          buildOrgPublicSearchText(person),
          profile?.headline ?? "",
          profile?.skills.join(" ") ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : people

  const currentUser = session
    ? org.users.find((user) => user.id === session.userId) ?? null
    : null
  const currentProfile = currentUser ? getSocialProfile(social, currentUser.id) : null

  const userById = new Map(org.users.map((user) => [user.id, user]))
  // Só kudos cujas duas pontas existem no store de org: o cartão renderiza o
  // nome de quem deu e de quem recebeu, e um id sem usuário quebraria a linha.
  const muralCompleto = social.kudos
    .filter((kudo) => userById.has(kudo.fromUserId) && userById.has(kudo.toUserId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const mural = muralCompleto.slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pessoas"
        description="A rede interna da Ybera — conheça quem constrói com você e reconheça bons momentos."
      />

      {/* Mobile: âncora pessoal antes da lista */}
      {currentUser ? (
        <MyNetworkCard user={currentUser} profile={currentProfile} className="lg:hidden" />
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Coluna principal: toolbar + grade de perfis */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InputGroup className="h-9 w-full max-w-sm">
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar pessoa, cargo ou skill"
              />
            </InputGroup>
            <p className="text-xs text-muted-foreground">
              {normalizedQuery
                ? `${filtered.length} de ${people.length} pessoas`
                : `${people.length} pessoas na rede`}
            </p>
          </div>

          {filtered.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map(({ user, person, profile, kudosCount }) => {
                const isCurrentUser = user.id === session?.userId

                return (
                  <Link
                    key={user.id}
                    href={`/people/${user.id}`}
                    className="group overflow-hidden rounded-2xl border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
                  >
                    <div className={cn("h-16", getPersonCoverClassName(person.name))} />
                    <div className="flex flex-col gap-2 px-5 pb-5">
                      <div className="flex items-end justify-between">
                        <PersonAvatar
                          name={person.name}
                          imageUrl={person.avatarUrl}
                          size="xl"
                          className="-mt-6 ring-4 ring-card"
                        />
                        {isCurrentUser ? <Badge variant="secondary">Você</Badge> : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-md font-semibold tracking-tight text-foreground">
                          {person.name}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {profile?.headline || person.title}
                        </p>
                      </div>
                      {/* Uma fileira só, e todas as badges no mesmo peso.
                          Antes eram duas: cargo e área em contorno, depois as
                          skills em preenchimento preto. Duas fileiras e dois
                          pesos para o mesmo tipo de metadado — e o preto puxava
                          o olho para a skill, que é o detalhe, em vez do nome.

                          O cargo saiu porque já está na linha acima: o headline
                          é `profile.headline || person.title`, então quem não
                          preencheu headline via a mesma palavra duas vezes
                          seguidas ("Colaborador" sob "Colaborador").

                          Sobra o essencial de um diretório: onde a pessoa atua
                          e o que ela sabe fazer. */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline">{person.areaName}</Badge>
                        {profile?.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                        {profile && profile.skills.length > 3 ? (
                          <Badge variant="outline">+{profile.skills.length - 3}</Badge>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Sparkles className="size-3.5 text-accent-ink" />
                          {kudosCount === 1
                            ? "1 reconhecimento"
                            : `${kudosCount} reconhecimentos`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink opacity-0 transition-opacity group-hover:opacity-100">
                          Ver perfil
                          <ArrowUpRight className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyStateCard
              title="Nenhuma pessoa encontrada"
              description="Tente buscar por outro nome, cargo, setor, skill ou gestor."
            />
          )}
        </div>

        {/* Rail: âncora pessoal + mural */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          {currentUser ? (
            <MyNetworkCard
              user={currentUser}
              profile={currentProfile}
              className="hidden lg:block"
            />
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Mural de reconhecimentos</CardTitle>
                {/* Conta o que é RENDERIZÁVEL, não `social.kudos.length`.
                    Contando o total bruto, o badge dizia 6 enquanto a lista
                    mostrava o estado vazio: os kudos existiam mas apontavam
                    para usuários ausentes do store de org, e o filtro do mural
                    os descartava. Um número que a lista abaixo desmente é pior
                    que nenhum número. */}
                {muralCompleto.length ? (
                  <Badge variant="secondary">{muralCompleto.length}</Badge>
                ) : null}
              </div>
              <CardDescription>O que a rede anda celebrando publicamente.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 pt-0">
              {mural.length ? (
                mural.map((kudo) => {
                  const from = userById.get(kudo.fromUserId)!
                  const to = userById.get(kudo.toUserId)!
                  const meta = KUDO_TYPE_META[kudo.type]

                  return (
                    <div
                      key={kudo.id}
                      className="flex gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-accent/50"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm">
                        {meta.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">{from.name}</span>{" "}
                          reconheceu{" "}
                          <Link
                            href={`/people/${to.id}`}
                            className="font-medium text-accent-ink hover:underline"
                          >
                            {to.name}
                          </Link>
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-foreground/85">
                          “{kudo.message}”
                        </p>
                        <p className="mt-1 text-2xs text-muted-foreground">
                          {meta.label} · {formatKudoDate(kudo.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Nenhum reconhecimento ainda. Visite o perfil de um colega e deixe o primeiro. ✨
                </p>
              )}
              {/* Diz o corte em vez de esconder. O badge conta o total, a lista
                  mostra as 8 mais recentes, e sem essa linha os dois números
                  discordariam na cara do leitor — o mesmo defeito que o badge
                  tinha quando contava kudos que a lista filtrava. */}
              {muralCompleto.length > mural.length ? (
                <p className="px-2 pt-2 text-2xs text-muted-foreground">
                  Mostrando {mural.length} de {muralCompleto.length} — os mais recentes.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

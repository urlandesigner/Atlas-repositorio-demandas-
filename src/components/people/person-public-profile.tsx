"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Pencil, Send } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { Input } from "@/components/ui/input"
import { PersonAvatar } from "@/components/ui/person-avatar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { getOrgPublicPerson } from "@/lib/org/public"
import {
  addKudo,
  getKudosReceived,
  getOrgSocialServerSnapshot,
  getOrgSocialSnapshot,
  getPersonCoverStyle,
  getSocialProfile,
  KUDO_TYPE_META,
  KUDO_TYPES,
  subscribeOrgSocialStore,
  upsertSocialProfile,
  type KudoType,
  type SocialProfile,
} from "@/lib/org/social"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
import type { OrgUser } from "@/lib/org/types"

function formatSince(iso: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(iso))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatKudoDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-xs font-medium text-foreground">{value}</span>
    </div>
  )
}

export function PersonPublicProfile({ userId }: { userId: string }) {
  const { session } = useAuth()
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const social = useSyncExternalStore(
    subscribeOrgSocialStore,
    getOrgSocialSnapshot,
    getOrgSocialServerSnapshot
  )
  const [editOpen, setEditOpen] = useState(false)

  const user = org.users.find((entry) => entry.id === userId)

  if (!user) {
    return (
      <EmptyStateCard
        title="Pessoa não encontrada"
        description="Esse perfil público não está mais disponível na rede."
        action={
          <Link href="/people" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft data-icon="inline-start" />
            Voltar para pessoas
          </Link>
        }
      />
    )
  }

  const person = getOrgPublicPerson(org, user)
  const profile = getSocialProfile(social, user.id)
  const kudos = getKudosReceived(social, user.id)
  const isCurrentUser = session?.userId === user.id
  const userById = new Map(org.users.map((entry) => [entry.id, entry]))

  // Colegas de time: quem divide o mesmo gestor, ou quem essa pessoa lidera.
  const teammates = org.users.filter((entry) => {
    if (entry.id === user.id) return false
    if (person.reportCount > 0) return entry.managerId === user.id
    return user.managerId ? entry.managerId === user.managerId : false
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/people" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft data-icon="inline-start" />
          Voltar
        </Link>
        {isCurrentUser ? (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" data-icon="inline-start" />
            Editar perfil público
          </Button>
        ) : null}
        {person.managerId ? (
          <Link
            href={`/people/${person.managerId}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver gestor
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        ) : null}
      </div>

      {/* Hero social */}
      <Card className="overflow-hidden py-0">
        <div className="h-28 sm:h-36" style={getPersonCoverStyle(person.name)} />
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <PersonAvatar
                name={person.name}
                imageUrl={person.avatarUrl}
                size="lg"
                className="-mt-10 size-20 ring-4 ring-card"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {person.name}
                  </h1>
                  {isCurrentUser ? <Badge variant="secondary">Você</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile?.headline || person.title}
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-border/70 bg-background/60 px-4 py-2 text-center">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {kudos.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {kudos.length === 1 ? "reconhecimento" : "reconhecimentos"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{person.title}</Badge>
            <Badge variant="outline">{person.areaName}</Badge>
            <Badge variant="outline">{person.teamLabel}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-6">
          {/* Sobre */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sobre</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {profile?.bio ? (
                <p className="text-sm leading-relaxed text-foreground/85">{profile.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isCurrentUser
                    ? "Você ainda não escreveu sua bio pública. Conte para a rede no que você trabalha."
                    : "Essa pessoa ainda não escreveu a bio pública."}
                </p>
              )}
              {profile?.skills.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Mural da pessoa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reconhecimentos</CardTitle>
              <CardDescription>
                Mensagens públicas deixadas por colegas da rede.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-0">
              {!isCurrentUser && session ? (
                <KudoComposer fromUserId={session.userId} toUser={user} />
              ) : null}

              {kudos.length ? (
                <div className="flex flex-col divide-y divide-border/60">
                  {kudos.map((kudo) => {
                    const from = userById.get(kudo.fromUserId)
                    const meta = KUDO_TYPE_META[kudo.type]

                    return (
                      <div key={kudo.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-base">
                          {meta.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {from ? (
                              <Link
                                href={`/people/${from.id}`}
                                className="text-sm font-medium text-foreground hover:text-brand hover:underline"
                              >
                                {from.name}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium text-foreground">
                                Ex-colaborador
                              </span>
                            )}
                            <Badge variant="secondary" className="font-normal">
                              {meta.label}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatKudoDate(kudo.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">
                            {kudo.message}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {isCurrentUser
                    ? "Você ainda não recebeu reconhecimentos. Eles aparecem aqui quando um colega deixar um."
                    : "Seja a primeira pessoa a deixar um reconhecimento. ✨"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna de informações públicas */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações públicas</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/60 pt-0">
              <InfoRow label="Cargo" value={person.title} />
              <InfoRow label="Setor" value={person.areaName} />
              <InfoRow label="Time" value={person.teamLabel} />
              <InfoRow
                label="Gestor"
                value={
                  person.managerId ? (
                    <Link
                      href={`/people/${person.managerId}`}
                      className="text-brand hover:underline"
                    >
                      {person.managerName}
                    </Link>
                  ) : (
                    person.managerName
                  )
                }
              />
              <InfoRow label="Na Ybera desde" value={formatSince(user.createdAt)} />
              <InfoRow
                label="Estrutura"
                value={
                  person.reportCount > 0
                    ? person.reportCount === 1
                      ? "Lidera 1 pessoa"
                      : `Lidera ${person.reportCount} pessoas`
                    : "Atuação individual"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {person.reportCount > 0 ? "Time direto" : "Colegas de time"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 pt-0">
              {teammates.length ? (
                teammates.slice(0, 6).map((teammate) => (
                  <Link
                    key={teammate.id}
                    href={`/people/${teammate.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/50"
                  >
                    <PersonAvatar name={teammate.name} imageUrl={teammate.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {teammate.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {getOrgPublicPerson(org, teammate).title}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  Sem outras pessoas vinculadas ao mesmo time por enquanto.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isCurrentUser ? (
        <ProfileEditSheet
          key={editOpen ? "edit-open" : "edit-closed"}
          open={editOpen}
          onOpenChange={setEditOpen}
          userId={user.id}
          profile={profile}
        />
      ) : null}
    </div>
  )
}

function KudoComposer({ fromUserId, toUser }: { fromUserId: string; toUser: OrgUser }) {
  const [type, setType] = useState<KudoType>("colaboracao")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function handleSend() {
    try {
      addKudo({ fromUserId, toUserId: toUser.id, type, message })
      setMessage("")
      setError(null)
      setSent(true)
    } catch (err) {
      setSent(false)
      setError(err instanceof Error ? err.message : "Não foi possível enviar.")
    }
  }

  const firstName = toUser.name.split(" ")[0]

  return (
    <div className="rounded-2xl border border-brand/25 bg-brand-muted/40 p-4">
      <p className="text-sm font-medium text-foreground">
        Reconhecer {firstName} publicamente
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {KUDO_TYPES.map((kudoType) => {
          const meta = KUDO_TYPE_META[kudoType]
          const active = kudoType === type
          return (
            <button
              key={kudoType}
              type="button"
              onClick={() => setType(kudoType)}
              title={meta.helper}
              className={
                active
                  ? "inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-colors"
                  : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
              }
            >
              <span>{meta.emoji}</span>
              {meta.label}
            </button>
          )
        })}
      </div>
      <Textarea
        value={message}
        onChange={(event) => {
          setMessage(event.target.value)
          if (sent) setSent(false)
        }}
        placeholder={`Conte para a rede o que ${firstName} fez de bom…`}
        rows={3}
        className="mt-3 bg-card"
      />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {sent ? (
        <p className="mt-2 text-sm text-brand">Reconhecimento publicado no mural. 🎉</p>
      ) : null}
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={handleSend} disabled={!message.trim()}>
          <Send className="size-3.5" data-icon="inline-start" />
          Publicar reconhecimento
        </Button>
      </div>
    </div>
  )
}

function ProfileEditSheet({
  open,
  onOpenChange,
  userId,
  profile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  profile: SocialProfile | null
}) {
  const [headline, setHeadline] = useState(profile?.headline ?? "")
  const [bio, setBio] = useState(profile?.bio ?? "")
  const [skills, setSkills] = useState(profile?.skills.join(", ") ?? "")

  function handleSave() {
    upsertSocialProfile(userId, {
      headline,
      bio,
      skills: skills.split(","),
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar perfil público</SheetTitle>
          <SheetDescription>
            Essas informações ficam visíveis para toda a rede interna.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4 pt-0">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Headline</span>
            <Input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="Uma frase sobre o que você faz"
              maxLength={90}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Bio</span>
            <Textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Conte no que você trabalha, o que gosta de fazer…"
              rows={4}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Skills</span>
            <Input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              placeholder="React, Design System, Pesquisa…"
            />
            <span className="text-xs text-muted-foreground">
              Separe por vírgula. Até 8 aparecem no seu perfil.
            </span>
          </label>
        </div>
        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

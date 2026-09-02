"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { ArrowLeft, RotateCcw, Save } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { DiscProfilePicker } from "@/components/gestao/disc-profile-picker"
import { DiscAiSuggestions } from "@/components/gestao/disc-ai-suggestions"
import { LideradoObjectivesPanel } from "@/components/gestao/liderado-objectives-panel"
import { LideradoOneOnOnePanel } from "@/components/gestao/liderado-one-on-one-panel"
import { LideradoPdiPanel } from "@/components/gestao/liderado-pdi-panel"
import { SoftSkillsEditor } from "@/components/gestao/soft-skills-editor"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { PersonAvatar } from "@/components/ui/person-avatar"
import { Textarea } from "@/components/ui/textarea"
import { logAudit } from "@/lib/gestao/audit/store"
import {
  getBehavioralProfile,
  getSoftSkillsRadar,
  saveBehavioralProfile,
  saveSoftSkillsRadar,
} from "@/lib/gestao/profiles-store"
import { applyAreaTemplateToRadar } from "@/lib/gestao/soft-skills-template/store"
import type { BehavioralProfile, SoftSkillsRadar } from "@/lib/gestao/types"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
import { getOrgPublicPerson } from "@/lib/org/public"
import { cn } from "@/lib/utils"

export default function LideradoDetailPage() {
  const params = useParams<{ id: string }>()
  return <LideradoDetailContent key={params.id} userId={params.id} />
}

function LideradoDetailContent({ userId }: { userId: string }) {
  const router = useRouter()
  const { session } = useAuth()

  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)

  const user = useMemo(() => org.users.find((entry) => entry.id === userId), [org.users, userId])
  const person = useMemo(() => (user ? getOrgPublicPerson(org, user) : null), [org, user])

  const [behavioral, setBehavioral] = useState<BehavioralProfile>(() =>
    getBehavioralProfile(userId)
  )
  const [softSkills, setSoftSkills] = useState<SoftSkillsRadar>(() => getSoftSkillsRadar(userId))
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !session) return
    const allowed =
      user.managerId === session.userId || session.role === "admin"
    if (!allowed) {
      router.replace("/gestao/liderados")
    }
  }, [router, session, user])

  if (!user) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Colaborador não encontrado.
      </div>
    )
  }

  function saveBehavioral() {
    saveBehavioralProfile(behavioral)
    if (session?.areaId) {
      logAudit({
        areaId: session.areaId,
        actorId: session.userId,
        action: "profile.behavioral_updated",
        entityType: "behavioral_profile",
        entityId: userId,
        summary: `Perfil comportamental de ${user?.name ?? "colaborador"} atualizado.`,
      })
    }
    setSaved("Perfil comportamental salvo.")
    window.setTimeout(() => setSaved(null), 2500)
  }

  function saveSoftSkillsData() {
    saveSoftSkillsRadar(softSkills)
    setSaved("Radar de competências salvo.")
    window.setTimeout(() => setSaved(null), 2500)
  }

  function applyAreaTemplate() {
    if (!user) return
    const areaId = user.areaId ?? session?.areaId ?? null
    setSoftSkills(applyAreaTemplateToRadar(softSkills, areaId))
    setSaved("Pilares atualizados com o template da área.")
    window.setTimeout(() => setSaved(null), 2500)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* O "Voltar" saiu de dentro da coluna de texto: enquanto ele morava lá, o
          avatar precisava de um `mt-7` chutado para chegar perto do nome. */}
      <Link
        href="/gestao/liderados"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit gap-1 text-muted-foreground"
        )}
      >
        <ArrowLeft className="size-3.5" />
        Voltar
      </Link>

      {/* Card de identidade em vez de nome solto sobre o fundo da página. A tela
          é longa — perfil, radar, PDI, objetivos, 1:1 — e a pessoa de quem se
          fala precisa de um bloco que a ancore, como em /people/<id>. Os fatos
          vêm do mesmo helper daquela tela, para as duas contarem a mesma coisa.

          O sino de notificações NÃO vive aqui: ele é cromo do shell, não parte
          da identidade da pessoa. Sem `data-page-actions` na página, a moldura
          mostra o sino flutuante dela mesma — que é o comportamento previsto
          para telas sem CTA primário. */}
      <Card>
        <CardContent className="flex flex-col gap-4 px-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4">
            {/* Grade de duas colunas: o avatar ocupa as duas primeiras linhas — nome
                e a linha de apoio — e se centra NELAS, não só na do nome. Os chips
                ficam na terceira linha e herdam o recuo pela coluna.

                Antes a caixa do avatar tinha a altura da linha do nome e o círculo
                transbordava dela. Funcionava aos 32px que o avatar realmente
                recebia; quando o tamanho pedido passou a valer, 48px centrado numa
                linha só desequilibrou o bloco.

                Sem número mágico aqui: `row-span-2 self-center` resolve sozinho, e
                muda de altura junto com a tipografia. */}
            <PersonAvatar
              name={user.name}
              imageUrl={user.avatarUrl}
              size="2xl"
              className="row-span-2 self-center"
            />
            <h1 className="col-start-2 text-2xl font-semibold tracking-tight">{user.name}</h1>
            <p className="col-start-2 mt-1 text-sm text-muted-foreground">{user.email}</p>
            <div className="col-start-2 mt-2.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{user.kind ?? "colaborador"}</Badge>
                {user.managementTitle ? (
                  <Badge variant="outline">{user.managementTitle}</Badge>
                ) : null}
                {person ? (
                  <>
                    <Badge variant="outline">{person.areaName}</Badge>
                    <Badge variant="outline">{person.teamLabel}</Badge>
                  </>
                ) : null}
            </div>
          </div>
          {saved ? (
            <p className="shrink-0 text-sm text-accent-ink">{saved}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil comportamental</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DiscProfilePicker
            value={behavioral.discProfiles}
            onChange={(discProfiles) => setBehavioral({ ...behavioral, discProfiles })}
          />

          <DiscAiSuggestions
            discProfiles={behavioral.discProfiles}
            onApply={(suggestions) =>
              setBehavioral({
                ...behavioral,
                strengths: suggestions.strengths,
                attentionPoints: suggestions.attentionPoints,
                howToLead: suggestions.howToLead,
                howNotToLead: suggestions.howNotToLead,
              })
            }
          />

          <ProfileField
            label="Forças"
            value={behavioral.strengths}
            onChange={(strengths) => setBehavioral({ ...behavioral, strengths })}
            placeholder="Pontos fortes observados no dia a dia…"
          />
          <ProfileField
            label="Pontos de atenção"
            value={behavioral.attentionPoints}
            onChange={(attentionPoints) => setBehavioral({ ...behavioral, attentionPoints })}
            placeholder="O que merece acompanhamento ou desenvolvimento…"
          />
          <ProfileField
            label="Como liderar"
            value={behavioral.howToLead}
            onChange={(howToLead) => setBehavioral({ ...behavioral, howToLead })}
            placeholder="Estilo de liderança que funciona melhor…"
          />
          <ProfileField
            label="Como NÃO liderar"
            value={behavioral.howNotToLead}
            onChange={(howNotToLead) => setBehavioral({ ...behavioral, howNotToLead })}
            placeholder="Abordagens que costumam gerar atrito ou queda de performance…"
          />

          <Button onClick={saveBehavioral}>
            <Save data-icon="inline-start" />
            Salvar perfil comportamental
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Radar de competências</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pilares e notas customizáveis por liderado. Use o{" "}
            <Link href="/gestao/soft-skills" className="text-accent-ink hover:underline">
              template da área
            </Link>{" "}
            como ponto de partida.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <SoftSkillsEditor value={softSkills} onChange={setSoftSkills} />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={applyAreaTemplate}>
              <RotateCcw data-icon="inline-start" />
              Aplicar template da área
            </Button>
            <Button onClick={saveSoftSkillsData}>
              <Save data-icon="inline-start" />
              Salvar radar
            </Button>
          </div>
        </CardContent>
      </Card>

      {session ? (
        <>
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Plano de desenvolvimento</h2>
            <LideradoPdiPanel
              collaborator={user}
              managerId={session.userId}
              areaId={session.areaId ?? user.areaId ?? ""}
            />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Objetivos</h2>
            <LideradoObjectivesPanel collaborator={user} managerId={session.userId} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Preparação 1:1</h2>
            <LideradoOneOnOnePanel collaborator={user} managerId={session.userId} />
          </section>
        </>
      ) : null}
    </div>
  )
}

function ProfileField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <Field label={label}>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    </Field>
  )
}

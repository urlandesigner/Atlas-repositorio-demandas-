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
  getOrgUserById,
  subscribeOrgStore,
} from "@/lib/org/store"
import { cn } from "@/lib/utils"

export default function LideradoDetailPage() {
  const params = useParams<{ id: string }>()
  return <LideradoDetailContent key={params.id} userId={params.id} />
}

function LideradoDetailContent({ userId }: { userId: string }) {
  const router = useRouter()
  const { session } = useAuth()

  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)

  const user = useMemo(() => getOrgUserById(userId), [org.users, userId])

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
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/gestao/liderados"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-2 gap-1 text-muted-foreground"
            )}
          >
            <ArrowLeft className="size-3.5" />
            Voltar
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{user.kind ?? "colaborador"}</Badge>
            {user.managementTitle ? (
              <Badge variant="secondary">{user.managementTitle}</Badge>
            ) : null}
          </div>
        </div>
        {saved ? <p className="text-sm text-brand">{saved}</p> : null}
      </div>

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
            <Link href="/gestao/soft-skills" className="text-brand hover:underline">
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
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    </label>
  )
}

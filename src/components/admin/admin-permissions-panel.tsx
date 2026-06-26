"use client"

import { useState, useSyncExternalStore } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { logAudit } from "@/lib/gestao/audit/store"
import {
  type AreaPermissions,
  getAreaPermissions,
  getPermissionsServerSnapshot,
  getPermissionsSnapshot,
  saveAreaPermissions,
  subscribePermissionsStore,
} from "@/lib/gestao/permissions/store"

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 accent-brand"
      />
    </label>
  )
}

export function AdminPermissionsPanel() {
  const { session } = useAuth()
  useSyncExternalStore(subscribePermissionsStore, getPermissionsSnapshot, getPermissionsServerSnapshot)

  const areaId = session?.areaId ?? ""
  const persistedFlags = getAreaPermissions(areaId)
  const [draftFlags, setDraftFlags] = useState<AreaPermissions | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const flags = draftFlags?.areaId === areaId ? draftFlags : persistedFlags

  function handleSave() {
    if (!areaId || !session) return
    saveAreaPermissions(areaId, {
      collaboratorCanViewDisc: flags.collaboratorCanViewDisc,
      collaboratorCanViewSoftSkills: flags.collaboratorCanViewSoftSkills,
      collaboratorCanViewHowToLead: flags.collaboratorCanViewHowToLead,
      gestorCanEditFrameworks: flags.gestorCanEditFrameworks,
      gestorCanEditSoftSkillsTemplate: flags.gestorCanEditSoftSkillsTemplate,
    })
    logAudit({
      areaId,
      actorId: session.userId,
      action: "permissions.updated",
      entityType: "area_permissions",
      entityId: areaId,
      summary: "Permissões de visibilidade da área atualizadas.",
    })
    setDraftFlags(null)
    setSaved("Permissões salvas.")
    window.setTimeout(() => setSaved(null), 2500)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Visibilidade e permissões</CardTitle>
        {saved ? <span className="text-sm text-brand">{saved}</span> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleRow
          label="Colaborador vê perfil comportamental"
          description="Exibe perfil comportamental (somente leitura) no Meu Perfil."
          checked={flags.collaboratorCanViewDisc}
          onChange={(value) => setDraftFlags({ ...flags, collaboratorCanViewDisc: value })}
        />
        <ToggleRow
          label="Colaborador vê competências"
          description="Exibe o radar de competências avaliado pelo gestor no Meu Perfil."
          checked={flags.collaboratorCanViewSoftSkills}
          onChange={(value) => setDraftFlags({ ...flags, collaboratorCanViewSoftSkills: value })}
        />
        <ToggleRow
          label="Colaborador vê orientações de liderança"
          description="Inclui campos 'Como liderar' e 'Como NÃO liderar'."
          checked={flags.collaboratorCanViewHowToLead}
          onChange={(value) => setDraftFlags({ ...flags, collaboratorCanViewHowToLead: value })}
        />
        <ToggleRow
          label="Gestor edita trilhas de PDI"
          description="Se desativado, apenas admin cria e edita trilhas."
          checked={flags.gestorCanEditFrameworks}
          onChange={(value) => setDraftFlags({ ...flags, gestorCanEditFrameworks: value })}
        />
        <ToggleRow
          label="Gestor edita modelo de competências"
          description="Se desativado, apenas admin define os pilares padrão da área."
          checked={flags.gestorCanEditSoftSkillsTemplate}
          onChange={(value) =>
            setDraftFlags({ ...flags, gestorCanEditSoftSkillsTemplate: value })
          }
        />
        <Button onClick={handleSave}>Salvar permissões</Button>
      </CardContent>
    </Card>
  )
}

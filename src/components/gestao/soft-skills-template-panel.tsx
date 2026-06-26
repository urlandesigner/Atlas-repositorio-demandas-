"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { RotateCcw, Save } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { SoftSkillsPillarsEditor } from "@/components/gestao/soft-skills-pillars-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { logAudit } from "@/lib/gestao/audit/store"
import {
  canGestorEditSoftSkillsTemplate,
  getPermissionsServerSnapshot,
  getPermissionsSnapshot,
  subscribePermissionsStore,
} from "@/lib/gestao/permissions/store"
import {
  getAreaSoftSkillsTemplate,
  saveAreaSoftSkillsTemplate,
} from "@/lib/gestao/soft-skills-template/store"
import { DEFAULT_SOFT_SKILL_PILLARS, type SoftSkillPillar } from "@/lib/gestao/types"

export function SoftSkillsTemplatePanel({ readOnlyHint }: { readOnlyHint?: string }) {
  const { session } = useAuth()
  const areaId = session?.areaId ?? ""

  const permissionsData = useSyncExternalStore(
    subscribePermissionsStore,
    getPermissionsSnapshot,
    getPermissionsServerSnapshot
  )

  const canEdit = useMemo(() => {
    if (!session?.areaId || !session.role) return false
    return canGestorEditSoftSkillsTemplate(session.areaId, session.role)
  }, [permissionsData, session?.areaId, session?.role])

  const [pillars, setPillars] = useState<SoftSkillPillar[]>(() =>
    getAreaSoftSkillsTemplate(areaId).pillars.map((pillar) => ({ ...pillar }))
  )
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    if (!areaId || !session || !canEdit) return
    setError(null)

    try {
      saveAreaSoftSkillsTemplate(areaId, pillars)
      logAudit({
        areaId,
        actorId: session.userId,
        action: "soft_skills_template.updated",
        entityType: "soft_skills_template",
        entityId: areaId,
        summary: "Modelo de competências da área atualizado.",
      })
      setSaved("Modelo salvo.")
      window.setTimeout(() => setSaved(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.")
    }
  }

  function handleResetDefaults() {
    if (!canEdit) return
    setPillars(DEFAULT_SOFT_SKILL_PILLARS.map((pillar) => ({ ...pillar })))
    setError(null)
  }

  if (!areaId) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">Modelo de competências</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilares padrão da área — customizáveis. Gestores herdam este modelo e podem ajustar
            na ficha de cada liderado.
          </p>
        </div>
        {saved ? <span className="text-sm text-brand">{saved}</span> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {!canEdit ? (
          <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {readOnlyHint ?? "Somente leitura — edição restrita pelo admin da área."}
          </p>
        ) : null}

        <SoftSkillsPillarsEditor
          pillars={pillars}
          onChange={setPillars}
          readOnly={!canEdit}
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>
              <Save data-icon="inline-start" />
              Salvar modelo
            </Button>
            <Button variant="outline" onClick={handleResetDefaults}>
              <RotateCcw data-icon="inline-start" />
              Restaurar padrão inicial
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

"use client"

import { Download } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { logAudit } from "@/lib/gestao/audit/store"
import { buildManagerExport, downloadJson } from "@/lib/gestao/export"

export function GestaoExportPanel() {
  const { session } = useAuth()

  function handleExport() {
    if (!session?.areaId) return
    const payload = buildManagerExport(session.userId, session.areaId)
    downloadJson(`atlas-gestao-liderados-${session.userId}.json`, payload)
    logAudit({
      areaId: session.areaId,
      actorId: session.userId,
      action: "export.generated",
      entityType: "export",
      summary: "Exportação JSON dos liderados gerada.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exportar time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Exporta PDI, perfis, objetivos e relatórios 1:1 das pessoas do seu time.
        </p>
        <Button onClick={handleExport}>
          <Download data-icon="inline-start" />
          Baixar exportação
        </Button>
      </CardContent>
    </Card>
  )
}

"use client"

import { Download } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { logAudit } from "@/lib/gestao/audit/store"
import { buildAreaExport, downloadJson } from "@/lib/gestao/export"

export function AdminExportPanel() {
  const { session } = useAuth()

  function handleExport() {
    if (!session?.areaId) return
    const payload = buildAreaExport(session.areaId)
    downloadJson(`atlas-gestao-area-${session.areaId}.json`, payload)
    logAudit({
      areaId: session.areaId,
      actorId: session.userId,
      action: "export.generated",
      entityType: "export",
      summary: "Exportação JSON da área gerada.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exportar dados da área</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Gera um arquivo JSON com org, PDI, perfis, objetivos, relatórios, auditoria e
          permissões da área.
        </p>
        <Button onClick={handleExport}>
          <Download data-icon="inline-start" />
          Baixar exportação
        </Button>
      </CardContent>
    </Card>
  )
}

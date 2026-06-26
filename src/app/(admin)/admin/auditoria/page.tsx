import { AdminAuditPanel } from "@/components/admin/admin-audit-panel"

export default function AdminAuditoriaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico de ações relevantes na área (PDI, objetivos, permissões, exportações).
        </p>
      </div>
      <AdminAuditPanel />
    </div>
  )
}

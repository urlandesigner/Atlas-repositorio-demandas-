import { AdminAuditPanel } from "@/components/admin/admin-audit-panel"
import { PageHeader } from "@/components/ui/page-header"

export default function AdminAuditoriaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auditoria"
        description="Histórico de ações relevantes na área (PDI, objetivos, permissões, exportações)."
      />
      <AdminAuditPanel />
    </div>
  )
}

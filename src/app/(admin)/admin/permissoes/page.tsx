import { AdminPermissionsPanel } from "@/components/admin/admin-permissions-panel"
import { PageHeader } from "@/components/ui/page-header"

export default function AdminPermissoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Permissões"
        description="Controle o que colaboradores e gestores podem ver e editar na área."
      />
      <AdminPermissionsPanel />
    </div>
  )
}

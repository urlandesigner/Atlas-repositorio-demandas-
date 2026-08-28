import { AdminPdiPanel } from "@/components/admin/admin-pdi-panel"
import { PageHeader } from "@/components/ui/page-header"

export default function AdminPdisPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="PDI"
        description="Solicitações de subida e visão consolidada dos planos da área."
      />
      <AdminPdiPanel />
    </div>
  )
}

import { AdminExportPanel } from "@/components/admin/admin-export-panel"
import { PageHeader } from "@/components/ui/page-header"

export default function AdminExportacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exportação"
        description="Baixe um pacote JSON com os dados de gestão da área."
      />
      <AdminExportPanel />
    </div>
  )
}

import { AdminExportPanel } from "@/components/admin/admin-export-panel"

export default function AdminExportacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exportação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Baixe um pacote JSON com os dados de gestão da área.
        </p>
      </div>
      <AdminExportPanel />
    </div>
  )
}

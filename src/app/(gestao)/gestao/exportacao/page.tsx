import { GestaoExportPanel } from "@/components/gestao/gestao-export-panel"
import { PageHeader } from "@/components/ui/page-header"

export default function GestaoExportacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exportação"
        description="Exporte dados dos seus liderados para backup ou análise externa."
      />
      <GestaoExportPanel />
    </div>
  )
}

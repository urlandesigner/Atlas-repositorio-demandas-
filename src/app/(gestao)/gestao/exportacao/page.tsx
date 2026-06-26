import { GestaoExportPanel } from "@/components/gestao/gestao-export-panel"

export default function GestaoExportacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exportação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exporte dados dos seus liderados para backup ou análise externa.
        </p>
      </div>
      <GestaoExportPanel />
    </div>
  )
}

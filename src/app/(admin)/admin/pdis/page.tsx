import { AdminPdiPanel } from "@/components/admin/admin-pdi-panel"

export default function AdminPdisPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PDI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicitações de subida e visão consolidada dos planos da área.
        </p>
      </div>
      <AdminPdiPanel />
    </div>
  )
}

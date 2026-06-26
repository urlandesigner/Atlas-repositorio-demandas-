import { AdminPermissionsPanel } from "@/components/admin/admin-permissions-panel"

export default function AdminPermissoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle o que colaboradores e gestores podem ver e editar na área.
        </p>
      </div>
      <AdminPermissionsPanel />
    </div>
  )
}

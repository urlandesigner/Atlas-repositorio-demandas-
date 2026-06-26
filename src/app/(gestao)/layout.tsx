import { AuthProvider } from "@/components/auth/auth-provider"
import { RequireRole } from "@/components/auth/require-role"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RequireRole roles={["gestor"]}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </RequireRole>
    </AuthProvider>
  )
}

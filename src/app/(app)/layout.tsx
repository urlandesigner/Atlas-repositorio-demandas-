import { AuthProvider } from "@/components/auth/auth-provider"
import { RequireRole } from "@/components/auth/require-role"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { AppShellContent } from "@/components/shell/app-shell-content"
import { RecordsProvider } from "@/components/shell/records-provider"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RequireRole roles={["colaborador", "gestor"]}>
        <RecordsProvider>
          <SidebarProvider>
            <AppSidebar />
            <AppShellContent>{children}</AppShellContent>
          </SidebarProvider>
        </RecordsProvider>
      </RequireRole>
    </AuthProvider>
  )
}

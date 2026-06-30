import { AuthProvider } from "@/components/auth/auth-provider"
import { RequireRole } from "@/components/auth/require-role"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { AppShellContent } from "@/components/shell/app-shell-content"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RequireRole roles={["gestor", "admin"]}>
        <SidebarProvider>
          <AppSidebar />
          <AppShellContent>{children}</AppShellContent>
        </SidebarProvider>
      </RequireRole>
    </AuthProvider>
  )
}

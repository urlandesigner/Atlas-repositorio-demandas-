import { AppHeader } from "@/components/shell/app-header"
import { SidebarInset } from "@/components/ui/sidebar"

export function AppShellContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset>
      <AppHeader />
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </SidebarInset>
  )
}

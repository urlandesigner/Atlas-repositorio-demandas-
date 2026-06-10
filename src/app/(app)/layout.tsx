import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { RecordsProvider } from "@/components/shell/records-provider"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RecordsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </RecordsProvider>
  )
}

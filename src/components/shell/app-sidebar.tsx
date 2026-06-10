"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderOpen,
  CircleDot,
  Presentation,
  Target,
  Database,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projetos", href: "/projects", icon: FolderOpen },
  { label: "Timeline", href: "/professional/timeline", icon: CircleDot },
  { label: "Objetivos", href: "/professional/objectives", icon: Target },
  { label: "Apresentações", href: "/professional/presentations", icon: Presentation },
  { label: "Backup", href: "/backup", icon: Database },
]

type NavItem = { label: string; href: string; icon: React.ElementType }

function NavMenu({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              render={<Link href={item.href} />}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center justify-between gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand shadow-[0_8px_20px_oklch(0.6_0.12_162/0.24)]">
              <span className="text-brand-foreground text-sm font-bold tracking-tight">A</span>
            </div>
            <span className="text-[17px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Atlas
            </span>
          </div>
          <SidebarTrigger className="size-10 rounded-xl text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden" />
        </div>
        <SidebarSeparator className="mx-0" />
        <div className="hidden justify-center pt-2 group-data-[collapsible=icon]:flex">
          <SidebarTrigger className="size-10 rounded-xl text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMenu items={navItems} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter className="mt-4 border-t border-sidebar-border/60 px-4 pt-4">
        <div className="flex items-center gap-3 rounded-xl group-data-[collapsible=icon]:justify-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted">
            <span className="text-xs font-semibold text-brand-muted-foreground">U</span>
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-medium truncate text-sidebar-foreground/90">Usuário</p>
            <p className="text-[11px] text-sidebar-foreground/45 truncate">urlan87@gmail.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

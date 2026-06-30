"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CircleDot,
  Download,
  Flag,
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Radar,
  Shield,
  Target,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { shellHeaderClassName } from "@/components/shell/shell-header-styles"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  activePaths?: string[]
  exact?: boolean
}

const workspaceNavItems: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Perfil",
    href: "/professional/profile",
    icon: UserRound,
    activePaths: ["/professional/evolution", "/professional/presentations"],
  },
  { label: "Projetos", href: "/projects", icon: FolderOpen },
  { label: "Trajetória", href: "/professional/timeline", icon: CircleDot },
  { label: "Objetivos", href: "/professional/objectives", icon: Target },
]

const gestaoNavItems: NavItem[] = [
  { label: "Resumo", href: "/gestao", icon: LayoutDashboard, exact: true },
  { label: "Meu time", href: "/gestao/liderados", icon: Users },
  { label: "Cadastro do time", href: "/gestao/colaboradores", icon: UserRound },
  { label: "PDIs", href: "/gestao/pdi", icon: Target },
  { label: "Competências", href: "/gestao/soft-skills", icon: Radar },
  { label: "Metas do time", href: "/gestao/objetivos", icon: Flag },
  { label: "Exportar dados", href: "/gestao/exportacao", icon: Download },
]

const adminNavItems: NavItem[] = [
  { label: "Resumo", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Gestores", href: "/admin/gestores", icon: UserCog },
  { label: "Colaboradores", href: "/admin/colaboradores", icon: Users },
  { label: "PDIs", href: "/admin/pdis", icon: Target },
  { label: "Competências", href: "/admin/soft-skills", icon: Radar },
  { label: "Permissões", href: "/admin/permissoes", icon: Shield },
  { label: "Auditoria", href: "/admin/auditoria", icon: History },
  { label: "Exportar dados", href: "/admin/exportacao", icon: Download },
]

const brandMarkClassName =
  "flex size-9 items-center justify-center rounded-lg bg-brand shadow-[0_8px_20px_color-mix(in_srgb,var(--color-brand)_24%,transparent)]"

function SidebarBrandMark() {
  const { state, toggleSidebar } = useSidebar()

  if (state === "collapsed") {
    return (
      <button
        type="button"
        onClick={toggleSidebar}
        className={cn(
          brandMarkClassName,
          "text-brand-foreground transition-colors hover:bg-primary/90"
        )}
        aria-label="Expandir sidebar"
      >
        <PanelLeft className="size-3.5" />
      </button>
    )
  }

  return (
    <div className={brandMarkClassName}>
      <span className="text-sm font-bold tracking-tight text-brand-foreground">A</span>
    </div>
  )
}

function NavGroup({
  items,
  pathname,
  label,
}: {
  items: NavItem[]
  pathname: string
  label?: string
}) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const matchers = [item.href, ...(item.activePaths ?? [])]
          const isActive = item.exact
            ? pathname === item.href
            : matchers.some((path) => pathname === path || pathname.startsWith(path + "/"))
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={isActive}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { session, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()
  const role = session?.role

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [pathname, isMobile, setOpenMobile])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={cn("gap-0 bg-sidebar p-0", shellHeaderClassName)}>
        <div className="flex h-full w-full items-center justify-between gap-3 px-4 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <SidebarBrandMark />
            <span className="text-[17px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Atlas
            </span>
          </div>
          <SidebarTrigger className="size-8 rounded-xl text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4">
        {role !== "admin" && <NavGroup items={workspaceNavItems} pathname={pathname} />}

        {role === "gestor" && (
          <>
            <SidebarSeparator />
            <NavGroup items={gestaoNavItems} pathname={pathname} label="Gestão" />
          </>
        )}

        {role === "admin" && <NavGroup items={adminNavItems} pathname={pathname} />}
      </SidebarContent>

      <SidebarFooter className="mt-4 gap-4 p-0 pb-4">
        <SidebarSeparator />
        <div className="flex flex-col gap-3 px-4 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-3 rounded-xl group-data-[collapsible=icon]:justify-center">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted">
              <span className="text-xs font-semibold text-brand-muted-foreground">
                {session?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-xs font-medium text-sidebar-foreground/90">
                {session?.name ?? "Usuário"}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/45">
                {session?.email ?? "—"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:p-0"
            onClick={() => logout()}
          >
            <LogOut className="size-3.5" />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

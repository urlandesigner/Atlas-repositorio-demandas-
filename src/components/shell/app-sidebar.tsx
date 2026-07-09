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
  Megaphone,
  MoreHorizontal,
  PanelLeft,
  Radar,
  Search,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PersonAvatar } from "@/components/ui/person-avatar"
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
  { label: "Pessoas", href: "/people", icon: Search },
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
  {
    label: "Colaboradores",
    href: "/admin/colaboradores",
    icon: Users,
    activePaths: ["/gestao/liderados"],
  },
  { label: "PDIs", href: "/admin/pdis", icon: Target },
  { label: "Competências", href: "/admin/soft-skills", icon: Radar },
  { label: "Avisos RH", href: "/admin/avisos-rh", icon: Megaphone },
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
        <div className="px-4">
          <div className="rounded-[12px] border border-border/70 bg-card/90 p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-start gap-3">
              <PersonAvatar name={session?.name ?? "Usuário"} size="lg" className="size-10" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground/92">
                  {session?.name ?? "Usuário"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {session?.email ?? "—"}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 rounded-[10px] text-sidebar-foreground/62 hover:bg-muted hover:text-sidebar-foreground"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem variant="destructive" onClick={() => logout()}>
                    <LogOut className="size-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="hidden justify-center group-data-[collapsible=icon]:flex">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-lg"
                    className="rounded-[12px] border-border/70 bg-card/90"
                  />
                }
              >
                <PersonAvatar name={session?.name ?? "Usuário"} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-44">
                <DropdownMenuItem variant="destructive" onClick={() => logout()}>
                  <LogOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

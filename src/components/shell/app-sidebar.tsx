"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
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
import { Trilha } from "@/components/career/trilha"
import { shellHeaderClassName } from "@/components/shell/shell-header-styles"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PersonAvatar } from "@/components/ui/person-avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  getProfileServerSnapshot,
  getProfileSnapshot,
  subscribeProfileStore,
} from "@/lib/profile/store"
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
  { label: "Projetos", href: "/projects", icon: FolderOpen },
  { label: "Objetivos", href: "/professional/objectives", icon: Target },
  { label: "Registros", href: "/professional/timeline", icon: CircleDot },
  { label: "Pessoas", href: "/people", icon: Search },
  {
    label: "Perfil",
    href: "/professional/profile",
    icon: UserRound,
    activePaths: ["/professional/evolution", "/professional/presentations"],
  },
]

const gestaoNavItems: NavItem[] = [
  { label: "Resumo", href: "/gestao", icon: LayoutDashboard, exact: true },
  { label: "Meu time", href: "/gestao/liderados", icon: Users },
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
  "flex size-9 items-center justify-center rounded-lg bg-brand shadow-brand"

function SidebarBrandMark() {
  const { state, toggleSidebar } = useSidebar()

  if (state === "collapsed") {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleSidebar}
        className={cn(
          brandMarkClassName,
          "text-brand-foreground hover:bg-primary/90 hover:text-brand-foreground"
        )}
        aria-label="Expandir sidebar"
      >
        <PanelLeft className="size-3.5" />
      </Button>
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
        {items.map((item) => (
          <NavRow key={item.href} item={item} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const matchers = [item.href, ...(item.activePaths ?? [])]
  const isActive = item.exact
    ? pathname === item.href
    : matchers.some((path) => pathname === path || pathname.startsWith(path + "/"))

  return (
    <SidebarMenuItem>
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
}

/**
 * Grupo de navegação que abre e fecha — usado só pelo gestor.
 *
 * É o único papel que carrega duas navegações completas: 6 itens da área
 * pessoal mais 7 de Gestão, 13 no total. O colaborador tem 6 e o admin 9, cada
 * um com uma navegação só, e por isso seguem na lista plana — colapsar um grupo
 * único não esconde nada, só adiciona um clique.
 *
 * No trilho colapsado em ícones os itens voltam a aparecer sempre: ali não há
 * rótulo de grupo para clicar, e esconder metade dos ícones deixaria a
 * navegação sem saída.
 */
function CollapsibleNavGroup({
  label,
  items,
  pathname,
  open,
  onToggle,
}: {
  label: string
  items: NavItem[]
  pathname: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel
        render={<button type="button" onClick={onToggle} aria-expanded={open} />}
        className="w-full justify-between gap-2 text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/80"
      >
        <span>{label}</span>
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")}
        />
      </SidebarGroupLabel>
      <SidebarMenu className={cn(!open && "hidden group-data-[collapsible=icon]:flex")}>
        {items.map((item) => (
          <NavRow key={item.href} item={item} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

/** Trilha compacta na sidebar — a posição na carreira fica sempre visível. */
function SidebarTrilha() {
  const profile = useSyncExternalStore(
    subscribeProfileStore,
    getProfileSnapshot,
    getProfileServerSnapshot
  )

  if (!profile.ladder.length) return null

  return (
    <div className="px-4">
      <Trilha
        ladder={profile.ladder}
        currentLevelId={profile.identity.levelId}
        targetLevelId={profile.goal.targetLevelId}
        variant="mini"
      />
    </div>
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

  // O grupo do contexto em que a rota está abre; o outro recolhe. Um toggle
  // manual vale só até a pessoa navegar para o outro contexto — aí o padrão
  // volta a valer, e ela não precisa fechar nada à mão. Derivado no render, sem
  // efeito: `manualGroups` guarda o contexto em que a escolha foi feita, e
  // quando ele não bate mais com o atual a escolha simplesmente caduca.
  const activeGroup = pathname.startsWith("/gestao") ? "gestao" : "workspace"
  const [manualGroups, setManualGroups] = useState<{
    context: string
    open: { workspace: boolean; gestao: boolean }
  } | null>(null)

  const openGroups =
    manualGroups && manualGroups.context === activeGroup
      ? manualGroups.open
      : {
          workspace: activeGroup === "workspace",
          gestao: activeGroup === "gestao",
        }

  function toggleGroup(group: "workspace" | "gestao") {
    setManualGroups({
      context: activeGroup,
      open: { ...openGroups, [group]: !openGroups[group] },
    })
  }

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
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <ThemeToggle className="size-8 rounded-xl text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground" />
            <SidebarTrigger className="size-8 rounded-xl text-sidebar-foreground/72 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4">
        {role === "gestor" ? (
          <>
            <CollapsibleNavGroup
              label="Minha área"
              items={workspaceNavItems}
              pathname={pathname}
              open={openGroups.workspace}
              onToggle={() => toggleGroup("workspace")}
            />
            <SidebarSeparator />
            <CollapsibleNavGroup
              label="Gestão"
              items={gestaoNavItems}
              pathname={pathname}
              open={openGroups.gestao}
              onToggle={() => toggleGroup("gestao")}
            />
          </>
        ) : (
          <NavGroup
            items={role === "admin" ? adminNavItems : workspaceNavItems}
            pathname={pathname}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="mt-4 gap-4 p-0 pb-4">
        {/* Separador e trilha somem juntos no colapso — um wrapper `contents` evita
            que sobre uma barra órfã sem nada entre as duas. */}
        <div className="contents group-data-[collapsible=icon]:hidden">
          <SidebarSeparator />
          <SidebarTrilha />
        </div>
        <SidebarSeparator />
        <div className="px-4">
          <div className="rounded-[12px] border border-border/70 bg-card/90 p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-start gap-3">
              <PersonAvatar name={session?.name ?? "Usuário"} size="lg" />

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

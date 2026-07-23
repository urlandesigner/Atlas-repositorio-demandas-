"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  FileText,
  LayoutDashboard,
  Presentation,
  Radar,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"

// Nav unificada da seção "Meu Perfil": visão geral + evolução de carreira + conhecimento.
const NAV_ITEMS = [
  {
    href: "/professional/profile",
    label: "Resumo",
    description: "Identidade, PDI e objetivo de carreira",
    icon: LayoutDashboard,
  },
  {
    href: "/professional/evolution/radar",
    label: "Competências",
    description: "Evidências para o próximo nível",
    icon: Radar,
  },
  {
    href: "/professional/evolution/recognitions",
    label: "Reconhecimentos",
    description: "Feedbacks e kudos recebidos",
    icon: Award,
  },
  {
    href: "/professional/evolution/one-on-one",
    label: "1:1",
    description: "Notas das conversas com seu gestor",
    icon: FileText,
  },
  {
    href: "/professional/evolution/promotion",
    label: "Dossiê",
    description: "Narrativa para conversas de promoção",
    icon: Sparkles,
  },
  {
    href: "/professional/presentations",
    label: "Conhecimento",
    description: "O que você compartilhou com o time",
    icon: Presentation,
  },
] as const

export function EvolutionNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col gap-0.5", className)} aria-label="Meu Perfil">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-muted/60 text-brand-muted-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className="mt-0.5 size-4 shrink-0" />
            <span className="flex flex-col">
              {item.label}
              <span
                className={cn(
                  "text-xs font-normal",
                  active ? "text-brand-muted-foreground/70" : "text-muted-foreground/70"
                )}
              >
                {item.description}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function EvolutionNavMobile() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden" role="tablist">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-brand/30 bg-brand-muted/50 text-brand-muted-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

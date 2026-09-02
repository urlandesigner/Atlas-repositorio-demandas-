"use client"

import { UserIcon, Users2Icon, Building2Icon, GlobeIcon, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FilterPill, FilterPillGroup } from "@/components/ui/filter-pill"
import { ImpactDots } from "@/components/ui/impact-dots"
import { OptionCard } from "@/components/ui/option-card"
import { Overline } from "@/components/ui/overline"
import type { ImpactScope, ImpactLevel } from "@/lib/records/types"

export const SCOPES: { value: ImpactScope; label: string; icon: LucideIcon }[] = [
  { value: "personal", label: "Pessoal", icon: UserIcon },
  { value: "team", label: "Time", icon: Users2Icon },
  { value: "area", label: "Área", icon: Building2Icon },
  { value: "company", label: "Empresa", icon: GlobeIcon },
]

const LEVEL_CONFIG: Record<ImpactLevel, { label: string; description: string }> = {
  1: {
    label: "Baixo",
    description: "Mudança local, pouco visível externamente",
  },
  2: {
    label: "Médio",
    description: "Impacto perceptível, reconhecido pelo time",
  },
  3: {
    label: "Alto",
    description: "Resultado expressivo e mensurável",
  },
  4: {
    label: "Estratégico",
    description: "Impacto organizacional, ampla visibilidade",
  },
  5: {
    label: "Transformacional",
    description: "Mudança significativa na trajetória ou no produto",
  },
}

interface ImpactSelectorProps {
  scope: ImpactScope
  level: ImpactLevel
  onScopeChange: (scope: ImpactScope) => void
  onLevelChange: (level: ImpactLevel) => void
}

export function ImpactSelector({
  scope,
  level,
  onScopeChange,
  onLevelChange,
}: ImpactSelectorProps) {
  const levelConfig = LEVEL_CONFIG[level]

  return (
    <div className="flex flex-col gap-5">
      {/* Level */}
      <div className="flex flex-col gap-2">
        <Overline size="sm" className="text-muted-foreground/60">Nível de Impacto</Overline>
        <FilterPillGroup aria-label="Nível de impacto">
          {([1, 2, 3, 4, 5] as ImpactLevel[]).map((l) => (
            <FilterPill
              key={l}
              size="sm"
              active={l === level}
              onClick={() => onLevelChange(l)}
            >
              {LEVEL_CONFIG[l].label}
            </FilterPill>
          ))}
        </FilterPillGroup>
        <div className="flex items-center gap-2">
          <ImpactDots level={level} className="shrink-0" />
          <p className="text-2xs text-muted-foreground leading-snug">
            {levelConfig.description}
          </p>
        </div>
      </div>

      {/* Scope */}
      <div className="flex flex-col gap-2">
        <Overline size="sm" className="text-muted-foreground/60">Alcance</Overline>
        <div className="grid grid-cols-2 gap-1.5">
          {SCOPES.map((s) => {
            const Icon = s.icon
            const selected = scope === s.value
            return (
              <OptionCard
                key={s.value}
                active={selected}
                onClick={() => onScopeChange(s.value)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-2xs font-medium",
                  selected ? "text-brand-muted-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {s.label}
              </OptionCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { type ImpactScope, type ImpactLevel }

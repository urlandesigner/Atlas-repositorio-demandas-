"use client"

import {
  Users2Icon,
  PackageIcon,
  BriefcaseIcon,
  LayersIcon,
  BookOpenIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { FilterPill, FilterPillGroup } from "@/components/ui/filter-pill"
import type { AtuacaoType } from "@/lib/records/types"

export const ATUACOES: {
  value: AtuacaoType
  label: string
  icon: LucideIcon
}[] = [
  { value: "liderança", label: "Liderança", icon: Users2Icon },
  { value: "execução", label: "Execução", icon: PackageIcon },
  { value: "estratégia", label: "Estratégia", icon: BriefcaseIcon },
  { value: "arquitetura", label: "Arquitetura", icon: LayersIcon },
  { value: "mentoria", label: "Mentoria", icon: BookOpenIcon },
  { value: "inovação", label: "Inovação", icon: ZapIcon },
]

interface AtuacaoPickerProps {
  value: AtuacaoType
  onChange: (value: AtuacaoType) => void
}

export function AtuacaoPicker({ value, onChange }: AtuacaoPickerProps) {
  return (
    <FilterPillGroup aria-label="Tipo de atuação">
      {ATUACOES.map((a) => {
        const Icon = a.icon
        return (
          <FilterPill
            key={a.value}
            size="sm"
            active={value === a.value}
            onClick={() => onChange(a.value)}
            className="inline-flex items-center gap-1.5"
          >
            <Icon className="size-3" />
            {a.label}
          </FilterPill>
        )
      })}
    </FilterPillGroup>
  )
}

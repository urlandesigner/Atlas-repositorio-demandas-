"use client"

import {
  BoxIcon,
  MonitorIcon,
  LayoutGridIcon,
  CodeIcon,
  CogIcon,
  HeartIcon,
  BarChart2Icon,
  TagIcon,
  type LucideIcon,
} from "lucide-react"
import { FilterPill, FilterPillGroup } from "@/components/ui/filter-pill"
import type { AreaType } from "@/lib/records/types"

export const AREAS: {
  value: AreaType
  label: string
  icon: LucideIcon
}[] = [
  { value: "produto", label: "Produto", icon: BoxIcon },
  { value: "ux", label: "UX / Design", icon: MonitorIcon },
  { value: "design-system", label: "Design System", icon: LayoutGridIcon },
  { value: "engenharia", label: "Engenharia", icon: CodeIcon },
  { value: "processo", label: "Processo", icon: CogIcon },
  { value: "cultura", label: "Cultura", icon: HeartIcon },
  { value: "operacional", label: "Operacional", icon: BarChart2Icon },
  { value: "outros", label: "Outros", icon: TagIcon },
]

interface AreaPickerProps {
  value: AreaType
  onChange: (value: AreaType) => void
}

export function AreaPicker({ value, onChange }: AreaPickerProps) {
  return (
    <FilterPillGroup aria-label="Área">
      {AREAS.map((a) => {
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

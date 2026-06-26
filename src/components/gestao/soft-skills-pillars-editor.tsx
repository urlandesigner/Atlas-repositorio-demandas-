"use client"

import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SoftSkillPillar } from "@/lib/gestao/types"

export function SoftSkillsPillarsEditor({
  pillars,
  onChange,
  minPillars = 3,
  readOnly = false,
}: {
  pillars: SoftSkillPillar[]
  onChange: (next: SoftSkillPillar[]) => void
  minPillars?: number
  readOnly?: boolean
}) {
  function updateLabel(id: string, label: string) {
    onChange(pillars.map((pillar) => (pillar.id === id ? { ...pillar, label } : pillar)))
  }

  function addPillar() {
    const id = crypto.randomUUID()
    onChange([...pillars, { id, label: "Novo pilar" }])
  }

  function removePillar(id: string) {
    if (pillars.length <= minPillars) return
    onChange(pillars.filter((pillar) => pillar.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Pilares</span>
        <Button type="button" size="xs" variant="outline" onClick={addPillar} disabled={readOnly}>
          <Plus data-icon="inline-start" />
          Pilar
        </Button>
      </div>

      {pillars.map((pillar) => (
        <div key={pillar.id} className="flex items-start gap-2 rounded-lg border p-3">
          <Input
            value={pillar.label}
            onChange={(event) => updateLabel(pillar.id, event.target.value)}
            className="h-8"
            placeholder="Nome do pilar"
            readOnly={readOnly}
          />
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={readOnly || pillars.length <= minPillars}
            onClick={() => removePillar(pillar.id)}
            aria-label={`Remover ${pillar.label}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}

      <p className="text-xs text-muted-foreground">
        Mínimo de {minPillars} pilares. Novos liderados herdam este template; na ficha você ainda
        pode personalizar por pessoa.
      </p>
    </div>
  )
}

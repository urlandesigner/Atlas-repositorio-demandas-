"use client"

import { ChevronDown, ChevronUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DISC_PROFILES, type DiscProfileId } from "@/lib/gestao/types"

export function DiscProfilePicker({
  value,
  onChange,
}: {
  value: DiscProfileId[]
  onChange: (next: DiscProfileId[]) => void
}) {
  function toggle(id: DiscProfileId) {
    if (value.includes(id)) {
      onChange(value.filter((entry) => entry !== id))
      return
    }
    onChange([...value, id])
  }

  function move(id: DiscProfileId, direction: -1 | 1) {
    const index = value.indexOf(id)
    if (index < 0) return
    const target = index + direction
    if (target < 0 || target >= value.length) return
    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Selecione um ou mais perfis comportamentais. O{" "}
        <span className="font-medium text-foreground">primeiro selecionado é o predominante</span>{" "}
        — use as setas para reordenar.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DISC_PROFILES.map((profile) => {
          const selected = value.includes(profile.id)
          const rank = value.indexOf(profile.id)
          const isDominant = rank === 0

          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => toggle(profile.id)}
              className={cn(
                "rounded-[12px] border px-3 py-3 text-left transition-colors",
                selected ? profile.accentClass : "border-border hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{profile.label}</span>
                {selected ? (
                  <Badge variant="outline" className="text-[10px]">
                    {isDominant ? "Dominante" : `#${rank + 1}`}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs opacity-80">{profile.description}</p>
            </button>
          )
        })}
      </div>

      {value.length > 1 ? (
        <div className="rounded-[12px] border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">Ordem de predominância</p>
          <ul className="mt-2 space-y-2">
            {value.map((id, index) => {
              const profile = DISC_PROFILES.find((entry) => entry.id === id)
              if (!profile) return null
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{index + 1}.</span>
                    <span className="text-sm font-medium">{profile.label}</span>
                    {index === 0 ? (
                      <Badge className="h-5 text-[10px]">Dominante</Badge>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => move(id, -1)}
                      aria-label={`Subir ${profile.label}`}
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      disabled={index === value.length - 1}
                      onClick={() => move(id, 1)}
                      aria-label={`Descer ${profile.label}`}
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function DiscProfileBadges({ profiles }: { profiles: DiscProfileId[] }) {
  if (!profiles.length) {
    return <span className="text-xs text-muted-foreground">Perfil comportamental não preenchido</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {profiles.map((id, index) => {
        const profile = DISC_PROFILES.find((entry) => entry.id === id)
        if (!profile) return null
        return (
          <Badge
            key={id}
            variant="outline"
            className={cn("font-normal", profile.accentClass)}
          >
            {profile.label}
            {index === 0 ? " · dominante" : ""}
          </Badge>
        )
      })}
    </div>
  )
}

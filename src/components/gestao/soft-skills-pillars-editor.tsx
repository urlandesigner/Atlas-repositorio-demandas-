"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SoftSkillPillar } from "@/lib/gestao/types"
import { cn } from "@/lib/utils"

/**
 * Lista editável dos pilares de competência (modelo da área e ficha do liderado).
 *
 * Antes cada pilar era uma caixa com borda contendo um campo com outra borda:
 * duas molduras por item, seis vezes, campos de 1.100px para nomes de uma
 * palavra e a lixeira alinhada ao topo. Agora é uma lista numerada com uma
 * moldura só e divisórias, e o nome é texto que vira campo: a borda aparece
 * no hover e no foco, como em qualquer lista que se edita no lugar.
 *
 * A lixeira aparece no hover só onde existe hover; no toque fica sempre
 * visível, senão não haveria como apagar um pilar no celular.
 */
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
  // O pilar recém-criado ganha foco com o texto selecionado, para a pessoa
  // digitar o nome direto em vez de apagar "Novo pilar" à mão.
  const [justAddedId, setJustAddedId] = useState<string | null>(null)
  const atMinimum = pillars.length <= minPillars

  function updateLabel(id: string, label: string) {
    onChange(pillars.map((pillar) => (pillar.id === id ? { ...pillar, label } : pillar)))
  }

  function addPillar() {
    const id = crypto.randomUUID()
    setJustAddedId(id)
    onChange([...pillars, { id, label: "Novo pilar" }])
  }

  function removePillar(id: string) {
    if (atMinimum) return
    onChange(pillars.filter((pillar) => pillar.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Pilares</span>
        <span className="label-mono text-muted-foreground">
          {pillars.length} {pillars.length === 1 ? "pilar" : "pilares"}
        </span>
      </div>

      <ol className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
        {pillars.map((pillar, index) => (
          <li key={pillar.id} className="group/pillar flex items-center gap-2 py-1.5 pr-2 pl-4">
            <span
              aria-hidden="true"
              className="label-mono w-6 shrink-0 text-muted-foreground tabular-nums"
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            {readOnly ? (
              <span className="flex-1 px-3 py-2 text-sm text-foreground">{pillar.label}</span>
            ) : (
              <Input
                value={pillar.label}
                onChange={(event) => updateLabel(pillar.id, event.target.value)}
                autoFocus={pillar.id === justAddedId}
                onFocus={(event) => {
                  if (pillar.id === justAddedId) {
                    event.currentTarget.select()
                    setJustAddedId(null)
                  }
                }}
                aria-label={`Nome do pilar ${index + 1}`}
                placeholder="Nome do pilar"
                className="h-9 flex-1 border-transparent bg-transparent px-3 text-sm hover:border-input focus-visible:bg-card"
              />
            )}

            {readOnly ? null : (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={atMinimum}
                onClick={() => removePillar(pillar.id)}
                aria-label={`Remover ${pillar.label}`}
                title={atMinimum ? `O modelo precisa de pelo menos ${minPillars} pilares` : undefined}
                className={cn(
                  "shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-danger-foreground",
                  "transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/pillar:opacity-100 [@media(hover:hover)]:group-focus-within/pillar:opacity-100"
                )}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </li>
        ))}

        {readOnly ? null : (
          <li>
            <button
              type="button"
              onClick={addPillar}
              className="flex w-full items-center gap-2 py-3 pr-4 pl-4 text-sm font-medium text-accent-ink outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40"
            >
              <span className="flex w-6 shrink-0 justify-start" aria-hidden="true">
                <Plus className="size-4" />
              </span>
              <span className="px-3">Adicionar pilar</span>
            </button>
          </li>
        )}
      </ol>

      <p className="text-xs text-muted-foreground">
        Mínimo de {minPillars} pilares. Novos liderados herdam este modelo; na ficha você ainda
        pode personalizar por pessoa.
      </p>
    </div>
  )
}

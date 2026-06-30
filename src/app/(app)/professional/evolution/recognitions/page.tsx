"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { RecognitionFormSheet } from "@/components/evolution/recognition-form-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RECOGNITION_TYPE_LABEL,
  type RecognitionEntry,
} from "@/lib/evolution/types"
import {
  addRecognition,
  deleteRecognition,
  updateRecognition,
} from "@/lib/evolution/recognitions-store"
import { useEvolutionData } from "@/hooks/use-evolution-data"

export default function EvolutionRecognitionsPage() {
  const { recognitions } = useEvolutionData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RecognitionEntry | null>(null)

  function handleSubmit(data: Omit<RecognitionEntry, "id" | "createdAt" | "updatedAt">) {
    if (editing) {
      updateRecognition(editing.id, data)
    } else {
      addRecognition(data)
    }
    setEditing(null)
  }

  return (
    <EvolutionShell
      title="Reconhecimentos"
      description="Feedbacks e validações recebidos como evidência de carreira."
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus data-icon="inline-start" />
            Registrar reconhecimento
          </Button>
        </div>

        {recognitions.length ? (
          <div className="flex flex-col gap-3">
            {recognitions.map((item) => (
              <article
                key={item.id}
                className="rounded-[12px] border border-border/60 bg-card/[0.98] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      <Badge variant="outline" className="font-normal">
                        {RECOGNITION_TYPE_LABEL[item.type]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.recognizedBy}
                      {item.recognizerArea ? ` · ${item.recognizerArea}` : ""} ·{" "}
                      {new Date(item.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(item)
                        setOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteRecognition(item.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-border/80 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum reconhecimento registrado. Salve elogios e feedbacks que reforçam sua trajetória.
            </p>
          </div>
        )}
      </div>

      <RecognitionFormSheet
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSubmit={handleSubmit}
      />
    </EvolutionShell>
  )
}

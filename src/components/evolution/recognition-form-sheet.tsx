"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  RECOGNITION_TYPE_LABEL,
  type RecognitionEntry,
  type RecognitionType,
} from "@/lib/evolution/types"
import { cn } from "@/lib/utils"

const TYPES = Object.keys(RECOGNITION_TYPE_LABEL) as RecognitionType[]

export function RecognitionFormSheet({
  open,
  onOpenChange,
  onSubmit,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<RecognitionEntry, "id" | "createdAt" | "updatedAt">) => void
  editing?: RecognitionEntry | null
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [recognizedBy, setRecognizedBy] = useState("")
  const [recognizerArea, setRecognizerArea] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<RecognitionType>("impacto")
  const [evidenceUrl, setEvidenceUrl] = useState("")

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setDescription(editing.description)
      setRecognizedBy(editing.recognizedBy)
      setRecognizerArea(editing.recognizerArea ?? "")
      setDate(editing.date)
      setType(editing.type)
      setEvidenceUrl(editing.evidenceUrl ?? "")
    } else if (open) {
      setTitle("")
      setDescription("")
      setRecognizedBy("")
      setRecognizerArea("")
      setDate(new Date().toISOString().slice(0, 10))
      setType("impacto")
      setEvidenceUrl("")
    }
  }, [editing, open])

  function handleSubmit() {
    if (!title.trim() || !recognizedBy.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      recognizedBy: recognizedBy.trim(),
      recognizerArea: recognizerArea.trim() || undefined,
      date,
      type,
      linkedRecordIds: editing?.linkedRecordIds ?? [],
      evidenceUrl: evidenceUrl.trim() || undefined,
      projectId: editing?.projectId,
      projectName: editing?.projectName,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editing ? "Editar reconhecimento" : "Novo reconhecimento"}</SheetTitle>
          <SheetDescription>
            Registre feedbacks positivos como evidência profissional — não é uma rede social.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Título</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Destaque na entrega do projeto X" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Descrição</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="O que foi reconhecido e por quê"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Quem reconheceu</span>
              <Input value={recognizedBy} onChange={(e) => setRecognizedBy(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Data</span>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Área / squad</span>
            <Input value={recognizerArea} onChange={(e) => setRecognizerArea(e.target.value)} placeholder="Opcional" />
          </label>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    type === t
                      ? "border-brand/30 bg-brand-muted/50 text-brand-muted-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {RECOGNITION_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Link de evidência</span>
            <Input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="Opcional — Slack, email, doc" />
          </label>
        </div>

        <SheetFooter className="border-t border-border/60">
          <Button onClick={handleSubmit} disabled={!title.trim() || !recognizedBy.trim()}>
            {editing ? "Salvar" : "Registrar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

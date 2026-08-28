"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { FilterPill, FilterPillGroup } from "@/components/ui/filter-pill"
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
          <Field label="Título" size="sm">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Destaque na entrega do projeto X" />
          </Field>

          <Field label="Descrição" size="sm">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="O que foi reconhecido e por quê"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quem reconheceu" size="sm">
              <Input value={recognizedBy} onChange={(e) => setRecognizedBy(e.target.value)} />
            </Field>
            <Field label="Data" size="sm">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Área / squad" size="sm">
            <Input value={recognizerArea} onChange={(e) => setRecognizerArea(e.target.value)} placeholder="Opcional" />
          </Field>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <FilterPillGroup aria-label="Tipo" className="mt-2">
              {TYPES.map((t) => (
                <FilterPill key={t} size="sm" active={type === t} onClick={() => setType(t)}>
                  {RECOGNITION_TYPE_LABEL[t]}
                </FilterPill>
              ))}
            </FilterPillGroup>
          </div>

          <Field label="Link de evidência" size="sm">
            <Input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="Opcional — Slack, email, doc" />
          </Field>
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

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
  type RecognitionDraft,
  type RecognitionEntry,
  type RecognitionType,
} from "@/lib/evolution/types"

const TYPES = Object.keys(RECOGNITION_TYPE_LABEL) as RecognitionType[]

export function RecognitionFormSheet({
  open,
  onOpenChange,
  onSubmit,
  editing,
  draft,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RecognitionDraft) => void
  editing?: RecognitionEntry | null
  /**
   * Rascunho para uma entrada nova — usado quando ela nasce de outro lugar
   * (hoje, um elogio da rede). A pessoa revisa antes de salvar; nada entra no
   * dossiê sem passar por aqui.
   */
  draft?: RecognitionDraft | null
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [recognizedBy, setRecognizedBy] = useState("")
  const [recognizerArea, setRecognizerArea] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<RecognitionType>("impacto")
  const [evidenceUrl, setEvidenceUrl] = useState("")

  useEffect(() => {
    const source = editing ?? draft
    if (source) {
      setTitle(source.title)
      setDescription(source.description)
      setRecognizedBy(source.recognizedBy)
      setRecognizerArea(source.recognizerArea ?? "")
      setDate(source.date)
      setType(source.type)
      setEvidenceUrl(source.evidenceUrl ?? "")
    } else if (open) {
      setTitle("")
      setDescription("")
      setRecognizedBy("")
      setRecognizerArea("")
      setDate(new Date().toISOString().slice(0, 10))
      setType("impacto")
      setEvidenceUrl("")
    }
  }, [draft, editing, open])

  function handleSubmit() {
    if (!title.trim() || !recognizedBy.trim()) return
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      recognizedBy: recognizedBy.trim(),
      recognizerArea: recognizerArea.trim() || undefined,
      date,
      type,
      linkedRecordIds: editing?.linkedRecordIds ?? draft?.linkedRecordIds ?? [],
      evidenceUrl: evidenceUrl.trim() || undefined,
      projectId: editing?.projectId ?? draft?.projectId,
      projectName: editing?.projectName ?? draft?.projectName,
      sourceKudoId: editing?.sourceKudoId ?? draft?.sourceKudoId,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto" size="md">
        <SheetHeader>
          <SheetTitle>
            {editing
              ? "Editar reconhecimento"
              : draft?.sourceKudoId
                ? "Usar elogio como evidência"
                : "Novo reconhecimento"}
          </SheetTitle>
          <SheetDescription>
            {draft?.sourceKudoId
              ? "Revise antes de salvar: o texto veio de um elogio da rede e vai entrar no seu dossiê."
              : "Registre feedbacks positivos como evidência profissional — não é uma rede social."}
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

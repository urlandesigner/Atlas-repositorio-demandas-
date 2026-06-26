"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  createGestaoObjective,
  createGestaoObjectiveForm,
  deleteGestaoObjective,
  EMPTY_GESTAO_OBJECTIVE_FORM,
  getGestaoObjectivesServerSnapshot,
  getGestaoObjectivesSnapshot,
  getObjectivesForUser,
  OBJECTIVE_STATUS_LABEL,
  PDI_DIMENSION_LABEL,
  PDI_DIMENSION_OPTIONS,
  subscribeGestaoObjectivesStore,
  upsertGestaoObjective,
  type GestaoObjective,
  type GestaoObjectiveForm,
} from "@/lib/gestao/objectives/store"
import type { OrgUser } from "@/lib/org/types"
import { cn } from "@/lib/utils"

export function LideradoObjectivesPanel({
  collaborator,
  managerId,
}: {
  collaborator: OrgUser
  managerId: string
}) {
  const objectivesData = useSyncExternalStore(
    subscribeGestaoObjectivesStore,
    getGestaoObjectivesSnapshot,
    getGestaoObjectivesServerSnapshot
  )

  const objectives = useMemo(
    () => getObjectivesForUser(collaborator.id),
    [collaborator.id, objectivesData]
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<GestaoObjective | null>(null)
  const [form, setForm] = useState<GestaoObjectiveForm>(EMPTY_GESTAO_OBJECTIVE_FORM)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_GESTAO_OBJECTIVE_FORM)
    setSheetOpen(true)
  }

  function openEdit(objective: GestaoObjective) {
    setEditing(objective)
    setForm(createGestaoObjectiveForm(objective))
    setSheetOpen(true)
  }

  function toggleDimension(dimension: (typeof PDI_DIMENSION_OPTIONS)[number]) {
    setForm((prev) => ({
      ...prev,
      dimensions: prev.dimensions.includes(dimension)
        ? prev.dimensions.filter((item) => item !== dimension)
        : [...prev.dimensions, dimension],
    }))
  }

  function handleSubmit() {
    if (!form.title.trim()) return

    if (editing) {
      upsertGestaoObjective({
        ...editing,
        ...form,
        motivation: form.motivation.trim() || null,
        actionPlan: form.actionPlan.trim() || null,
        expectedEvidence: form.expectedEvidence.trim() || null,
        deadline: form.deadline || null,
        updatedAt: new Date().toISOString(),
      })
    } else {
      upsertGestaoObjective(
        createGestaoObjective({
          userId: collaborator.id,
          managerId,
          form,
        }),
        { isNew: true }
      )
    }

    setSheetOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Objetivos do ciclo</CardTitle>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Novo objetivo
          </Button>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {objectives.map((objective) => (
            <div key={objective.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{objective.title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline">{OBJECTIVE_STATUS_LABEL[objective.status]}</Badge>
                  {objective.dimensions.map((dimension) => (
                    <Badge key={dimension} variant="secondary">
                      {PDI_DIMENSION_LABEL[dimension]}
                    </Badge>
                  ))}
                </div>
                {objective.deadline ? (
                  <p className="mt-1 text-xs text-muted-foreground">Prazo: {objective.deadline}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(objective)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteGestaoObjective(objective.id, managerId)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {!objectives.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum objetivo definido para este liderado.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar objetivo" : "Novo objetivo"}</SheetTitle>
            <SheetDescription>
              Objetivo atribuído a {collaborator.name}. O colaborador verá no workspace.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 p-4 pt-0">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Título</span>
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Motivação</span>
              <Textarea
                value={form.motivation}
                onChange={(event) => setForm({ ...form, motivation: event.target.value })}
                rows={2}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Plano de ação</span>
              <Textarea
                value={form.actionPlan}
                onChange={(event) => setForm({ ...form, actionPlan: event.target.value })}
                rows={2}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Evidência esperada</span>
              <Textarea
                value={form.expectedEvidence}
                onChange={(event) => setForm({ ...form, expectedEvidence: event.target.value })}
                rows={2}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Prazo</span>
              <Input
                type="date"
                value={form.deadline}
                onChange={(event) => setForm({ ...form, deadline: event.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Status</span>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  value &&
                  setForm({
                    ...form,
                    status: value as GestaoObjectiveForm["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OBJECTIVE_STATUS_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Dimensões PDI</span>
              <div className="flex flex-wrap gap-2">
                {PDI_DIMENSION_OPTIONS.map((dimension) => (
                  <button
                    key={dimension}
                    type="button"
                    onClick={() => toggleDimension(dimension)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      form.dimensions.includes(dimension)
                        ? "border-brand/40 bg-brand-muted/50 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {PDI_DIMENSION_LABEL[dimension]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

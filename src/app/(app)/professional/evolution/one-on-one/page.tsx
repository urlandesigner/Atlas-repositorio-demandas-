"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { CalendarDays, Pencil, Plus, Save, Trash2 } from "lucide-react"

import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { useOptionalSession } from "@/hooks/use-optional-session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MetricCard } from "@/components/ui/metric-card"
import { Textarea } from "@/components/ui/textarea"
import {
  addOneOnOneEntry,
  createOneOnOneForm,
  deleteOneOnOneEntry,
  EMPTY_ONE_ON_ONE_FORM,
  getOneOnOneServerSnapshot,
  getOneOnOneSnapshot,
  saveOneOnOneEntries,
  subscribeOneOnOneStore,
  updateOneOnOneEntry,
  type OneOnOneEntry,
  type OneOnOneForm,
} from "@/lib/evolution/one-on-one-store"

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: OneOnOneEntry
  onEdit: (entry: OneOnOneEntry) => void
  onDelete: (entry: OneOnOneEntry) => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{formatDate(entry.date)}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Atualizado em {new Date(entry.updatedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
            <Pencil data-icon="inline-start" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(entry)}>
            <Trash2 data-icon="inline-start" />
            Excluir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{entry.notes}</p>
      </CardContent>
    </Card>
  )
}

export default function EvolutionOneOnOnePage() {
  const session = useOptionalSession()
  const entries = useSyncExternalStore(
    subscribeOneOnOneStore,
    getOneOnOneSnapshot,
    getOneOnOneServerSnapshot
  )
  const [editing, setEditing] = useState<OneOnOneEntry | null>(null)
  const [form, setForm] = useState<OneOnOneForm>(EMPTY_ONE_ON_ONE_FORM)

  const isEditing = Boolean(editing)
  const totalEntries = entries.length

  const latestEntry = useMemo(() => entries[0] ?? null, [entries])

  function set<K extends keyof OneOnOneForm>(field: K, value: OneOnOneForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setEditing(null)
    setForm({
      ...EMPTY_ONE_ON_ONE_FORM,
      date: new Date().toISOString().slice(0, 10),
    })
  }

  function handleSubmit() {
    if (!form.date || !form.notes.trim()) return

    const next = editing
      ? updateOneOnOneEntry(entries, editing.id, form)
      : addOneOnOneEntry(entries, form, session?.userId)

    saveOneOnOneEntries(next)
    resetForm()
  }

  function handleEdit(entry: OneOnOneEntry) {
    setEditing(entry)
    setForm(createOneOnOneForm(entry))
  }

  function handleDelete(entry: OneOnOneEntry) {
    const next = deleteOneOnOneEntry(entries, entry.id)
    saveOneOnOneEntries(next)
    if (editing?.id === entry.id) resetForm()
  }

  return (
    <EvolutionShell
      title="Relatório de 1:1"
      description="Registre cada 1:1 com data e o que ficou combinado."
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard
            variant="card"
            label="Registros salvos"
            value={totalEntries}
            helper="Um texto por 1:1, para manter o histórico claro e simples."
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Último 1:1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium">
                {latestEntry ? formatDate(latestEntry.date) : "Nenhum registro ainda"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {latestEntry
                  ? "Use esse histórico para revisitar acordos e evolução nas próximas conversas."
                  : "Quando quiser, registre aqui como foi a conversa com sua liderança."}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                {isEditing ? "Editar registro de 1:1" : "Novo registro de 1:1"}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Salve um único texto por conversa, com a data em que ela aconteceu.
              </p>
            </div>
            {isEditing ? <Badge variant="outline">Editando</Badge> : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Data do 1:1" className="max-w-xs">
              <Input
                type="date"
                value={form.date}
                onChange={(event) => set("date", event.target.value)}
              />
            </Field>

            <Field label="Como foi o 1:1">
              <Textarea
                value={form.notes}
                onChange={(event) => set("notes", event.target.value)}
                placeholder="Descreva os principais pontos da conversa, acordos, feedbacks, decisões e próximos passos."
                className="min-h-[220px] resize-y"
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSubmit}>
                {isEditing ? <Save data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                {isEditing ? "Salvar alterações" : "Registrar 1:1"}
              </Button>
              {isEditing ? (
                <Button variant="outline" onClick={resetForm}>
                  Cancelar edição
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Histórico</h2>
          </div>

          {entries.length ? (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/80 px-6 py-12 text-center text-sm text-muted-foreground">
              Nenhum 1:1 registrado ainda. Adicione a data e escreva um resumo da conversa.
            </div>
          )}
        </div>
      </div>
    </EvolutionShell>
  )
}

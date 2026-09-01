"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { OptionCard } from "@/components/ui/option-card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CollaboratorKind, OrgUser } from "@/lib/org/types"

const TYPE_OPTIONS: { value: CollaboratorKind; label: string; hint: string }[] = [
  { value: "colaborador", label: "Colaborador", hint: "Profissional IC, sem time sob gestão." },
  {
    value: "gestao",
    label: "Gestão / Coordenação",
    hint: "Liderança de time. Defina o cargo abaixo.",
  },
]

export function CollaboratorFormSheet({
  open,
  onOpenChange,
  onSubmit,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    name: string
    email: string
    kind: CollaboratorKind
    managementTitle: string | null
  }) => void
  editing?: OrgUser | null
}) {
  const [name, setName] = useState(editing?.name ?? "")
  const [email, setEmail] = useState(editing?.email ?? "")
  const [kind, setKind] = useState<CollaboratorKind>(editing?.kind ?? "colaborador")
  const [managementTitle, setManagementTitle] = useState(editing?.managementTitle ?? "")
  const [error, setError] = useState<string | null>(null)
  const isLeader = editing?.role === "gestor" || editing?.role === "admin"

  function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError("Preencha nome e email.")
      return
    }
    if (!isLeader && kind === "gestao" && !managementTitle.trim()) {
      setError("Informe o cargo de gestão (Head, Coordenador, Supervisor…).")
      return
    }

    try {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        kind,
        managementTitle: kind === "gestao" ? managementTitle.trim() : null,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto" size="md">
        <SheetHeader>
          <SheetTitle>{editing ? "Editar colaborador" : "Novo colaborador"}</SheetTitle>
          <SheetDescription>
            Cadastre pessoas do seu time e classifique o tipo de atuação. O acesso ao painel de gestão
            (papel de gestor) é concedido em Administração → Gestores.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          {isLeader ? (
            <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {editing?.name} é {editing?.role === "gestor" ? "gestor" : "administrador"} e também
              pode ser avaliado na matriz. Cargo e papel de liderança são definidos em
              Administração.
            </p>
          ) : null}

          <Field label="Nome" size="sm">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>

          <Field label="Email" size="sm">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          {!isLeader ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Tipo</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TYPE_OPTIONS.map((option) => {
                  const selected = kind === option.value
                  return (
                    <OptionCard
                      key={option.value}
                      active={selected}
                      onClick={() => setKind(option.value)}
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">{option.hint}</p>
                    </OptionCard>
                  )
                })}
              </div>
            </div>
          ) : null}

          {!isLeader && kind === "gestao" ? (
            <Field label="Cargo de gestão" size="sm">
              <Input
                value={managementTitle}
                onChange={(event) => setManagementTitle(event.target.value)}
                placeholder="Head, Coordenador, Supervisor…"
              />
            </Field>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{editing ? "Salvar" : "Cadastrar"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

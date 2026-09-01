"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { FrameworkPdiMatrix } from "@/components/gestao/framework-pdi-matrix"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
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
import {
  applyPdiToCollaborator,
  getFrameworkById,
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import type { OrgUser } from "@/lib/org/types"

export function AssignPdiSheet({
  open,
  onOpenChange,
  collaborator,
  managerId,
  onAssigned,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collaborator: OrgUser
  managerId: string
  onAssigned?: () => void
}) {
  const pdiData = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )
  const frameworks = pdiData.frameworks
  const [frameworkId, setFrameworkId] = useState(frameworks[0]?.id ?? "")
  const [currentLevelId, setCurrentLevelId] = useState(frameworks[0]?.ladder[0]?.id ?? "")
  const [targetLevelId, setTargetLevelId] = useState(frameworks[0]?.ladder[1]?.id ?? "__none__")
  const [cycleLabel, setCycleLabel] = useState("2026 · H1")
  const [error, setError] = useState<string | null>(null)

  const framework = useMemo(() => (frameworkId ? getFrameworkById(frameworkId) : undefined), [frameworkId])

  function handleSubmit() {
    if (!framework || !currentLevelId) {
      setError("Selecione a trilha e o nível atual.")
      return
    }

    try {
      applyPdiToCollaborator({
        userId: collaborator.id,
        frameworkId: framework.id,
        managerId,
        currentLevelId,
        targetLevelId: targetLevelId === "__none__" ? null : targetLevelId,
        cycleLabel,
      })
      onAssigned?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível aplicar o PDI.")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto" size="md">
        <SheetHeader>
          <SheetTitle>Aplicar PDI</SheetTitle>
          <SheetDescription>
            Vincule uma trilha a {collaborator.name}. O colaborador verá o PDI no perfil.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4 pt-0">
          <Field label="Trilha" size="sm">
            <Select
              value={frameworkId}
              onValueChange={(value) => {
                if (!value) return
                const selected = frameworks.find((entry) => entry.id === value)
                setFrameworkId(value)
                setCurrentLevelId(selected?.ladder[0]?.id ?? "")
                setTargetLevelId(selected?.ladder[1]?.id ?? "__none__")
                setError(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {framework ? (
            <>
              <Field label="Nível atual na trilha" size="sm">
                <Select
                  value={currentLevelId}
                  onValueChange={(value) => value && setCurrentLevelId(value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {(value: string) => framework.ladder.find((level) => level.id === value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {framework.ladder.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Meta de nível (opcional)" size="sm">
                <Select
                  value={targetLevelId}
                  onValueChange={(value) => value && setTargetLevelId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem meta definida" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem meta</SelectItem>
                    {framework.ladder.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </>
          ) : null}

          <Field label="Ciclo" size="sm">
            <Input value={cycleLabel} onChange={(event) => setCycleLabel(event.target.value)} />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Aplicar PDI</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function AssignedPdiSection({
  framework,
  currentLevels,
  expectedLevels,
  currentLevelName,
  targetLevelName,
  cycleLabel,
  readOnly = false,
  onLevelChange,
}: {
  framework: NonNullable<ReturnType<typeof getFrameworkById>>
  currentLevels: Record<string, number>
  expectedLevels: Record<string, number>
  currentLevelName: string
  targetLevelName?: string | null
  cycleLabel: string
  readOnly?: boolean
  onLevelChange?: (themeId: string, level: number) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{framework.name}</CardTitle>
          <Badge variant="outline">{cycleLabel}</Badge>
          {readOnly ? <Badge variant="secondary">Definido pelo gestor</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Nível na trilha: {currentLevelName}
          {targetLevelName ? ` · meta: ${targetLevelName}` : ""}
        </p>
      </CardHeader>
      <CardContent>
        <FrameworkPdiMatrix
          framework={framework}
          current={currentLevels}
          expected={expectedLevels}
          readOnly={readOnly}
          onLevelChange={onLevelChange}
        />
      </CardContent>
    </Card>
  )
}

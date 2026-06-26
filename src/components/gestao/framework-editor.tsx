"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"

import { FrameworkRubricSheet } from "@/components/gestao/framework-rubric-sheet"
import { PdiLevelTrack } from "@/components/profile/pdi-level-track"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatPdiLevel, PDI_MAX_LEVEL } from "@/lib/profile/pdi"
import {
  clampPdiLevel,
  createFrameworkDraft,
  type FrameworkTheme,
  type PdiFramework,
} from "@/lib/gestao/pdi/types"
import { createFramework, getFrameworkById, upsertFramework } from "@/lib/gestao/pdi/store"
import { cn } from "@/lib/utils"

const LEVELS = Array.from({ length: PDI_MAX_LEVEL + 1 }, (_, i) => i)

export function FrameworkEditor({ frameworkId }: { frameworkId: string }) {
  const router = useRouter()
  const isNew = frameworkId === "novo"

  const [draft, setDraft] = useState<PdiFramework>(() => {
    if (isNew) return createFrameworkDraft({ name: "Nova trilha" })
    return getFrameworkById(frameworkId) ?? createFrameworkDraft({ name: "Trilha" })
  })
  const [expectationLevelId, setExpectationLevelId] = useState(draft.ladder[0]?.id ?? "")
  const [rubricTheme, setRubricTheme] = useState<FrameworkTheme | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const expectationRow = useMemo(() => {
    return draft.expectations[expectationLevelId] ?? {}
  }, [draft.expectations, expectationLevelId])

  function updateDraft(next: PdiFramework) {
    setDraft(next)
    setSaved(null)
  }

  function handleSave() {
    if (!draft.name.trim()) {
      setError("Informe o nome da trilha.")
      return
    }
    if (!draft.ladder.length) {
      setError("Adicione ao menos um nível na trilha.")
      return
    }

    try {
      if (isNew) {
        const created = createFramework({
          name: draft.name,
          description: draft.description,
          ladder: draft.ladder,
          themes: draft.themes,
          expectations: draft.expectations,
        })
        router.replace(`/gestao/pdi/frameworks/${created.id}`)
        return
      }

      upsertFramework({ ...draft, updatedAt: new Date().toISOString() })
      setSaved("Trilha salva.")
      setError(null)
      window.setTimeout(() => setSaved(null), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.")
    }
  }

  function addLadderLevel() {
    const id = `level-${crypto.randomUUID().slice(0, 8)}`
    const nextLadder = [...draft.ladder, { id, name: `Nível ${draft.ladder.length + 1}` }]
    const lastExpectations = draft.expectations[draft.ladder[draft.ladder.length - 1]?.id ?? ""] ?? {}
    updateDraft({
      ...draft,
      ladder: nextLadder,
      expectations: {
        ...draft.expectations,
        [id]: Object.fromEntries(
          draft.themes.map((theme) => [theme.id, clampPdiLevel(lastExpectations[theme.id] ?? 3)])
        ),
      },
    })
  }

  function removeLadderLevel(levelId: string) {
    if (draft.ladder.length <= 1) return
    const nextLadder = draft.ladder.filter((level) => level.id !== levelId)
    const restExpectations = Object.fromEntries(
      Object.entries(draft.expectations).filter(([id]) => id !== levelId)
    )
    updateDraft({ ...draft, ladder: nextLadder, expectations: restExpectations })
    if (expectationLevelId === levelId) {
      setExpectationLevelId(nextLadder[0]?.id ?? "")
    }
  }

  function setExpectedLevel(themeId: string, level: number) {
    updateDraft({
      ...draft,
      expectations: {
        ...draft.expectations,
        [expectationLevelId]: {
          ...(draft.expectations[expectationLevelId] ?? {}),
          [themeId]: clampPdiLevel(level),
        },
      },
    })
  }

  function updateRubricLine(themeId: string, level: number, text: string) {
    updateDraft({
      ...draft,
      themes: draft.themes.map((theme) => {
        if (theme.id !== themeId) return theme
        const rubric = [...theme.rubric]
        rubric[level] = text
        return { ...theme, rubric }
      }),
    })
  }

  if (!isNew && !getFrameworkById(frameworkId) && draft.id !== frameworkId) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Trilha não encontrada.
      </div>
    )
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/gestao/pdi"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-2 gap-1 text-muted-foreground"
            )}
          >
            <ArrowLeft className="size-3.5" />
            Voltar
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "Nova trilha" : draft.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trilha, descrições por competência e expectativas por nível.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved ? <span className="text-sm text-brand">{saved}</span> : null}
          <Button onClick={handleSave}>
            <Save data-icon="inline-start" />
            Salvar
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nome</span>
            <Input
              value={draft.name}
              onChange={(event) => updateDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Descrição</span>
            <Textarea
              value={draft.description}
              onChange={(event) => updateDraft({ ...draft, description: event.target.value })}
              rows={2}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Níveis da trilha</CardTitle>
          <Button variant="outline" size="sm" onClick={addLadderLevel}>
            <Plus data-icon="inline-start" />
            Nível
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {draft.ladder.map((level) => (
            <div key={level.id} className="flex items-center gap-2">
              <Input
                value={level.name}
                onChange={(event) =>
                  updateDraft({
                    ...draft,
                    ladder: draft.ladder.map((entry) =>
                      entry.id === level.id ? { ...entry, name: event.target.value } : entry
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={draft.ladder.length <= 1}
                onClick={() => removeLadderLevel(level.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expectativas por nível</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nível da trilha</span>
            <Select
              value={expectationLevelId}
              onValueChange={(value) => value && setExpectationLevelId(value)}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {draft.ladder.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="flex flex-col gap-4">
            {draft.themes.map((theme) => {
              const expected = clampPdiLevel(expectationRow[theme.id])
              return (
                <div key={theme.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setRubricTheme(theme)}
                      className="text-left text-sm font-medium hover:underline"
                    >
                      {theme.label}
                    </button>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      esperado: {formatPdiLevel(expected)}
                    </span>
                  </div>
                  <PdiLevelTrack
                    current={expected}
                    expected={expected}
                    onSelect={(value) => setExpectedLevel(theme.id, value)}
                    size="sm"
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referências por competência</CardTitle>
          <CardDescription>
            Use frases curtas para nomear o que cada nível representa. Se precisar detalhar mais,
            o campo cresce conforme o texto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {draft.themes.map((theme) => (
            <section
              key={theme.id}
              className="rounded-[12px] border border-border/70 bg-background/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{theme.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Descreva como essa competência aparece em cada estágio.
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {LEVELS.length} níveis
                </Badge>
              </div>

              <div className="grid gap-2">
                {LEVELS.map((level) => (
                  <label
                    key={level}
                    className="grid grid-cols-[38px_minmax(0,1fr)] items-start gap-3 rounded-[10px] border border-border/60 bg-card/70 px-3 py-2.5 transition-colors focus-within:border-brand/40 focus-within:bg-brand-muted/25"
                  >
                    <span className="flex h-9 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                      {formatPdiLevel(level)}
                    </span>
                    <Textarea
                      value={theme.rubric[level] ?? ""}
                      onChange={(event) => updateRubricLine(theme.id, level, event.target.value)}
                      rows={1}
                      placeholder="Descreva este nível"
                      className="min-h-9 min-w-0 resize-none border-0 bg-transparent px-0 py-1 text-[15px] leading-6 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>

      <FrameworkRubricSheet
        theme={rubricTheme}
        current={0}
        expected={rubricTheme ? clampPdiLevel(expectationRow[rubricTheme.id]) : 0}
        onOpenChange={(open) => {
          if (!open) setRubricTheme(null)
        }}
        onSetExpected={
          rubricTheme
            ? (level) => {
                setExpectedLevel(rubricTheme.id, level)
                setRubricTheme(null)
              }
            : undefined
        }
      />
    </div>
  )
}

"use client"

import { useMemo, useSyncExternalStore } from "react"
import { ArrowRight, Minus, TrendingUp } from "lucide-react"

import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { MetricCard } from "@/components/ui/metric-card"
import { Overline } from "@/components/ui/overline"
import { useOptionalSession } from "@/hooks/use-optional-session"
import {
  getGestaoPdiServerSnapshot,
  getGestaoPdiSnapshot,
  subscribeGestaoPdiStore,
} from "@/lib/gestao/pdi/store"
import {
  computeFrameworkReadiness,
  getFrameworkExpectations,
  selectAssignmentsForUser,
  type PdiAssignment,
  type PdiFramework,
} from "@/lib/gestao/pdi/types"
import { cn } from "@/lib/utils"

/**
 * Histórico de PDI do colaborador — todos os ciclos, não só o vigente.
 *
 * Existia uma lacuna de dado visível: fechar um ciclo apenas troca o status
 * para "closed" e o registro fica no store, mas nada o lia do lado do
 * colaborador. `getActiveAssignmentForUser` devolve UM com `.find`, e era o
 * único leitor por usuário — então Meu Perfil mostrava o primeiro ativo e todo
 * ciclo anterior ficava inalcançável. O gestor tem /gestao/pdi e o admin tem
 * /admin/pdis; o colaborador não tinha rota nenhuma.
 *
 * Isso importa neste produto especificamente: a evolução de nível entre ciclos
 * é a evidência que sustenta conversa de promoção — "saí do 3 para o 5 em três
 * ciclos" — e o Atlas guardava esse dado sem mostrar.
 *
 * O `.find` continua onde está, de propósito: esta tela mostra todos, então
 * quem tiver dois PDIs ativos ao mesmo tempo passa a ver os dois aqui. Trocar o
 * `.find` de Meu Perfil por uma escolha explícita é outra decisão, de produto.
 */
export default function PdiHistoryPage() {
  const session = useOptionalSession()
  const gestaoPdi = useSyncExternalStore(
    subscribeGestaoPdiStore,
    getGestaoPdiSnapshot,
    getGestaoPdiServerSnapshot
  )

  const ciclos = useMemo(() => {
    if (!session) return []
    const assignments = selectAssignmentsForUser(gestaoPdi.assignments, session.userId)
    return assignments.map((assignment, index) => {
      const framework = gestaoPdi.frameworks.find(
        (item) => item.id === assignment.frameworkId
      )
      // O ciclo anterior é o próximo da lista COM O MESMO framework: comparar
      // níveis entre frameworks diferentes não diz nada, os temas não são os
      // mesmos.
      const anterior = assignments
        .slice(index + 1)
        .find((item) => item.frameworkId === assignment.frameworkId)
      return { assignment, framework, anterior }
    })
  }, [gestaoPdi.assignments, gestaoPdi.frameworks, session])

  return (
    <EvolutionShell
      title="Meus PDIs"
      description="Todos os ciclos do seu plano de desenvolvimento, do atual ao mais antigo."
    >
      <div className="flex max-w-3xl flex-col gap-4">
        {ciclos.length ? (
          ciclos.map(({ assignment, framework, anterior }) => (
            <CicloCard
              key={assignment.id}
              assignment={assignment}
              framework={framework}
              anterior={anterior}
            />
          ))
        ) : (
          <EmptyStateCard
            title="Você ainda não tem PDI"
            description="Quando seu gestor aplicar um plano de desenvolvimento, cada ciclo aparece aqui com a evolução de nível entre eles."
          />
        )}
      </div>
    </EvolutionShell>
  )
}

function CicloCard({
  assignment,
  framework,
  anterior,
}: {
  assignment: PdiAssignment
  framework?: PdiFramework
  anterior?: PdiAssignment
}) {
  const ativo = assignment.status === "active"

  const niveisAtuais = Object.fromEntries(
    Object.entries(assignment.current).map(([tema, valor]) => [tema, valor.level])
  )

  const esperados = framework
    ? getFrameworkExpectations(framework, assignment.currentLevelId)
    : {}

  const prontidao = framework
    ? computeFrameworkReadiness(
        niveisAtuais,
        esperados,
        framework.themes.map((tema) => tema.id)
      )
    : 0

  const nomeDoNivel = (levelId: string | null) =>
    (levelId && framework?.ladder.find((nivel) => nivel.id === levelId)?.name) || null

  const nivelAtual = nomeDoNivel(assignment.currentLevelId)
  const nivelMeta = nomeDoNivel(assignment.targetLevelId)

  const temasEvoluidos = framework
    ? framework.themes.filter((tema) => {
        if (!anterior) return false
        const antes = anterior.current[tema.id]?.level
        return antes !== undefined && niveisAtuais[tema.id] > antes
      }).length
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{assignment.cycleLabel}</CardTitle>
        <CardDescription>
          {framework?.name ?? "Framework removido"}
          {nivelAtual ? ` · ${nivelAtual}` : ""}
          {nivelMeta ? ` → meta ${nivelMeta}` : ""}
        </CardDescription>
        <CardAction className="flex flex-wrap items-center gap-1.5 @md/card-header:justify-end">
          <Badge variant={ativo ? "outline" : "secondary"}>
            {ativo ? "Ativo" : "Encerrado"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            variant="inset"
            label="Prontidão no ciclo"
            value={prontidao}
            suffix="%"
            helper={
              framework
                ? `${framework.themes.length} temas avaliados`
                : "sem framework"
            }
          />
          <MetricCard
            variant="inset"
            label="Temas que subiram"
            value={anterior ? temasEvoluidos : "—"}
            helper={
              anterior
                ? `desde ${anterior.cycleLabel}`
                : "primeiro ciclo, sem comparação"
            }
          />
        </div>

        {framework ? (
          <div>
            <Overline size="sm">Níveis por tema</Overline>
            <div className="mt-2 flex flex-col divide-y divide-border/60">
              {framework.themes.map((tema) => {
                const nivel = niveisAtuais[tema.id] ?? 0
                const antes = anterior?.current[tema.id]?.level
                const delta = antes === undefined ? null : nivel - antes
                const esperado = esperados[tema.id]
                return (
                  <div
                    key={tema.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">
                      {tema.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <DeltaDoTema delta={delta} />
                      <span className="font-mono text-sm tabular-nums text-foreground">
                        {nivel}
                        <span className="text-muted-foreground">/{esperado}</span>
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {assignment.notes ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {assignment.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/**
 * O quanto o tema andou desde o ciclo anterior. `null` no primeiro ciclo, onde
 * não existe comparação — e aí não se desenha nada, em vez de desenhar um zero
 * que sugeriria estagnação.
 */
function DeltaDoTema({ delta }: { delta: number | null }) {
  if (delta === null) return null
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" />
        <span className="sr-only">manteve o nível</span>
      </span>
    )
  }
  const subiu = delta > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs tabular-nums",
        subiu ? "text-success-foreground" : "text-danger-foreground"
      )}
    >
      {subiu ? <TrendingUp className="size-3" /> : <ArrowRight className="size-3 rotate-90" />}
      {subiu ? `+${delta}` : delta}
      <span className="sr-only">
        {subiu ? "subiu" : "caiu"} {Math.abs(delta)} desde o ciclo anterior
      </span>
    </span>
  )
}

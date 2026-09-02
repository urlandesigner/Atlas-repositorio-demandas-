"use client"

import { useMemo, useSyncExternalStore } from "react"
import { ArrowRight, ChevronRight, Minus, TrendingUp } from "lucide-react"

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
  type PdiBehavioralDimension,
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

  const avaliacao = assignment.evaluation

  // De onde vem o "antes" de cada tema. `evaluation.previous` ganha do ciclo
  // anterior do store porque é o ponto de partida que o gestor registrou NESTE
  // ciclo — não depende de o ciclo anterior existir, nem de ele ter usado o
  // mesmo framework.
  const nivelAnterior = (temaId: string) =>
    avaliacao?.previous[temaId] ?? anterior?.current[temaId]?.level

  const baseDaComparacao = avaliacao
    ? "registrado na avaliação"
    : anterior
      ? `desde ${anterior.cycleLabel}`
      : null

  const temasEvoluidos = framework
    ? framework.themes.filter((tema) => {
        const antes = nivelAnterior(tema.id)
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
          {avaliacao ? (
            <>
              <br />
              {`Avaliado por ${avaliacao.evaluatedBy} · ${new Date(
                avaliacao.evaluatedAt
              ).toLocaleDateString("pt-BR")}`}
            </>
          ) : null}
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
            value={baseDaComparacao ? temasEvoluidos : "—"}
            helper={baseDaComparacao ?? "primeiro ciclo, sem comparação"}
          />
        </div>

        {avaliacao ? (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              variant="inset"
              label="Nota final técnica"
              value={avaliacao.technicalScore}
              suffix="/6"
              helper="escala do framework"
            />
            <MetricCard
              variant="inset"
              label="Nota comportamental"
              value={avaliacao.behavioralScore}
              suffix="/5"
              helper={`média de ${avaliacao.behavioral.length} dimensões`}
            />
          </div>
        ) : null}

        {framework ? (
          <div>
            <Overline size="sm">Níveis por tema</Overline>
            <div className="mt-2 flex flex-col divide-y divide-border/60">
              {framework.themes.map((tema) => {
                const nivel = niveisAtuais[tema.id] ?? 0
                const antes = nivelAnterior(tema.id)
                const delta = antes === undefined ? null : nivel - antes
                const esperado = esperados[tema.id]
                const justificativa = avaliacao?.rationale[tema.id]
                const linha = (
                  <div className="flex items-center justify-between gap-3">
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
                // A justificativa vem recolhida: são seis parágrafos longos e,
                // abertos de saída, empurram os níveis — que são o que se lê
                // primeiro — para fora da tela.
                return justificativa ? (
                  <details key={tema.id} className="group/tema py-2">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      {linha}
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground group-open/tema:hidden">
                        <ChevronRight className="size-3" />
                        Por que essa nota
                      </span>
                    </summary>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {justificativa}
                    </p>
                  </details>
                ) : (
                  <div key={tema.id} className="py-2">
                    {linha}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {avaliacao?.behavioral.length ? (
          <Comportamental dimensoes={avaliacao.behavioral} />
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

/**
 * As dimensões comportamentais do ciclo, da maior nota para a menor.
 *
 * A forma é barra horizontal porque o trabalho do dado é comparar magnitude
 * entre categorias nomeadas — e com rótulos longos ("Design System —
 * consistência de uso e contribuição"), horizontal é a única orientação em que
 * eles cabem sem girar o texto. Escala fixa de 0 a 5, ancorada no zero: barra
 * que não começa do zero mente sobre a proporção.
 *
 * As cores das três primeiras e das três últimas são STATUS, não identidade — e
 * por isso nunca aparecem sozinhas: as listas "Forças" e "A desenvolver" ao lado
 * nomeiam exatamente as mesmas seis, então quem não distingue verde de vermelho
 * lê a mesma informação. As do meio ficam em cinza de propósito; colorir as
 * catorze transformaria estado em decoração.
 *
 * Os tons vêm dos tokens de status do app e foram medidos contra o TRILHO, que é
 * o fundo que importa numa barra — não contra o cartão: 4,56 e 8,60 para o
 * verde, 4,39 e 3,98 para o vermelho, 5,59 e 4,89 para o cinza, no claro e no
 * escuro. O mínimo de marca não-textual é 3:1, e os candidatos óbvios
 * reprovavam: `--success` dava 2,99 no claro e `--input` ficava abaixo de 3 nos
 * dois temas.
 */
function Comportamental({ dimensoes }: { dimensoes: PdiBehavioralDimension[] }) {
  const ordenadas = [...dimensoes].sort((a, b) => b.score - a.score)
  const forcas = ordenadas.slice(0, 3)
  const aDesenvolver = ordenadas.slice(-3).reverse()
  const ehForca = new Set(forcas.map((item) => item.id))
  const ehDesenvolver = new Set(aDesenvolver.map((item) => item.id))

  return (
    <div className="@container/comportamental flex flex-col gap-4">
      <div>
        <Overline size="sm">Skills comportamentais</Overline>
        <p className="mt-1 text-sm text-muted-foreground">
          Média das avaliações dos formulários deste processo, de 0 a 5.
        </p>
      </div>

      {/* minmax(0,1fr) e não 1fr: em grade, `1fr` tem min-width auto, então a
          coluna das barras crescia até caber o rótulo mais longo por inteiro e
          empurrava a coluna de Forças 181px para fora do cartão. Medido. */}
      <div className="grid gap-4 @xl/comportamental:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="flex flex-col gap-2">
          {ordenadas.map((dimensao) => (
            <div key={dimensao.id} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {dimensao.label}
              </span>
              <span
                aria-hidden
                className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted @md/comportamental:w-32"
              >
                <span
                  className={cn(
                    "block h-full rounded-full",
                    ehForca.has(dimensao.id)
                      ? "bg-success-foreground"
                      : ehDesenvolver.has(dimensao.id)
                        ? "bg-danger-foreground"
                        : "bg-muted-foreground"
                  )}
                  style={{ width: `${(dimensao.score / 5) * 100}%` }}
                />
              </span>
              <span className="w-9 shrink-0 text-right font-mono text-sm tabular-nums text-foreground">
                {dimensao.score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <ListaDeDestaque titulo="Forças" itens={forcas} tom="forca" />
          <ListaDeDestaque titulo="A desenvolver" itens={aDesenvolver} tom="desenvolver" />
        </div>
      </div>
    </div>
  )
}

function ListaDeDestaque({
  titulo,
  itens,
  tom,
}: {
  titulo: string
  itens: PdiBehavioralDimension[]
  tom: "forca" | "desenvolver"
}) {
  return (
    <div className="rounded-lg bg-muted p-5">
      <Overline size="sm">{titulo}</Overline>
      <ul className="mt-2 flex flex-col gap-1.5">
        {itens.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-sm text-foreground">{item.label}</span>
            <span
              className={cn(
                "shrink-0 font-mono text-sm tabular-nums",
                tom === "forca" ? "text-success-foreground" : "text-danger-foreground"
              )}
            >
              {item.score.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

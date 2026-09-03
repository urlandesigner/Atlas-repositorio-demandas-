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
import { PDI_MAX_LEVEL } from "@/lib/profile/pdi"
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
      // A contagem entra na descrição porque é a única linha que se lê sem
      // rolar. Antes o cartão do ciclo ativo tinha 1266px e o segundo ciclo
      // começava em 1394 — descobrir que havia mais de um exigia rolar uma tela
      // e meia.
      description={
        ciclos.length
          ? `${ciclos.length} ${ciclos.length === 1 ? "ciclo" : "ciclos"} do seu plano de desenvolvimento, do atual ao mais antigo.`
          : "Todos os ciclos do seu plano de desenvolvimento, do atual ao mais antigo."
      }
    >
      <div className="flex flex-col gap-4">
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

  const avanco = framework
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
      {/* Cada ciclo recolhe. O ativo abre; os encerrados ficam como linha, e a
          linha carrega número suficiente para comparar ciclos sem abrir nenhum
          — avanço e as duas notas. Assim o histórico inteiro cabe na
          primeira tela, que era o problema: o cartão ativo tinha 1266px e o
          segundo ciclo só aparecia em 1394. */}
      <details open={ativo} className="group/ciclo flex flex-col">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open/ciclo:rotate-90" />
              {assignment.cycleLabel}
            </CardTitle>
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
              {/* Só enquanto fechado: aberto, as mesmas medidas aparecem
                  logo abaixo como MetricCard, e repetir seria ruído. */}
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums group-open/ciclo:hidden">
                <span>{avanco}% de avanço</span>
                {avaliacao ? (
                  <>
                    <span>{avaliacao.technicalScore}/6 técnica</span>
                    <span>{avaliacao.behavioralScore}/5 comportamental</span>
                  </>
                ) : null}
              </span>
            </CardDescription>
            <CardAction className="flex flex-wrap items-center gap-1.5 @md/card-header:justify-end">
              <Badge variant={ativo ? "outline" : "secondary"}>
                {ativo ? "Ativo" : "Encerrado"}
              </Badge>
            </CardAction>
          </CardHeader>
        </summary>

        <CardContent className="mt-4 flex flex-col gap-4">
          {/* Uma fileira só, não duas. As quatro medidas em 2×2 gastavam 226px
              de altura; em quatro colunas gastam 113, e é o que faltava para o
              segundo ciclo caber na primeira tela. Volta a 2×2 abaixo de 640px,
              onde quatro colunas dariam ~80px cada e o número não caberia. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              variant="inset"
              label="Avanço no ciclo"
              value={avanco}
              suffix="%"
              helper={
                framework ? `${framework.themes.length} temas` : "sem framework"
              }
            />
            <MetricCard
              variant="inset"
              label="Temas que subiram"
              value={baseDaComparacao ? temasEvoluidos : "—"}
              helper={baseDaComparacao ?? "primeiro ciclo"}
            />
            {avaliacao ? (
              <>
                <MetricCard
                  variant="inset"
                  label="Nota técnica"
                  value={avaliacao.technicalScore}
                  suffix="/6"
                  helper="escala do framework"
                />
                <MetricCard
                  variant="inset"
                  label="Nota comportamental"
                  value={avaliacao.behavioralScore}
                  suffix="/5"
                  helper={`${avaliacao.behavioral.length} dimensões`}
                />
              </>
            ) : null}
          </div>

        {framework ? (
          <div>
            <Overline size="sm">Níveis por tema</Overline>
            <div className="mt-2 flex flex-col [&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:inset-x-0 [&>*+*]:before:top-0 [&>*+*]:before:h-px [&>*+*]:before:bg-border/60 [&>*+*]:before:content-['']">
              {framework.themes.map((tema) => {
                const nivel = niveisAtuais[tema.id] ?? 0
                const antes = nivelAnterior(tema.id)
                const delta = antes === undefined ? null : nivel - antes
                const esperado = esperados[tema.id]
                return (
                  <div key={tema.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0 truncate text-sm text-foreground">
                      {tema.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <DeltaDoTema delta={delta} />
                      {/* O denominador é o TETO DA ESCALA, igual para todos os
                          temas, não a expectativa do nível. Antes era o
                          esperado, e "4/5" se lia como "4 de no máximo 5" —
                          mas a escala do PDI vai a 6 em todos os seis temas. O
                          esperado ganhou lugar próprio: são dois fatos
                          diferentes e disputavam a mesma barra. */}
                      <span className="w-12 text-right font-mono text-sm tabular-nums text-foreground">
                        {nivel}
                        <span className="text-muted-foreground">/{PDI_MAX_LEVEL}</span>
                      </span>
                      <span className="w-20 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {esperado === undefined ? "" : `esperado ${esperado}`}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {framework && avaliacao ? (
          <Justificativas
            framework={framework}
            avaliacao={avaliacao}
            niveisAtuais={niveisAtuais}
          />
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
      </details>
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
 * Justificativa de cada nota, num bloco só.
 *
 * Antes era um accordion por tema, seis deles, cada um dentro da própria linha
 * de nível. Dois problemas: a fileira de níveis — que é o que se lê primeiro —
 * ficava com um "Por que essa nota" pendurado embaixo de cada linha, e o mesmo
 * gesto se repetia seis vezes para o mesmo tipo de conteúdo.
 *
 * Aqui é um recolhível único, na forma que o próprio relatório usa
 * ("Justificativa por skill"): a nota anterior e a acordada de cada tema, com o
 * texto do gestor ao lado. As linhas de nível voltaram a ser só números.
 */
function Justificativas({
  framework,
  avaliacao,
  niveisAtuais,
}: {
  framework: PdiFramework
  avaliacao: NonNullable<PdiAssignment["evaluation"]>
  niveisAtuais: Record<string, number>
}) {
  const temasComTexto = framework.themes.filter((tema) => avaliacao.rationale[tema.id])
  if (!temasComTexto.length) return null

  return (
    <details className="group/just">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <Overline size="sm" className="flex items-center gap-1.5">
          <ChevronRight className="size-3 shrink-0 transition-transform group-open/just:rotate-90" />
          Justificativa por skill
        </Overline>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="group-open/just:hidden">
            {temasComTexto.length} temas com o porquê da nota, da nota anterior à acordada.
          </span>
          <span className="hidden group-open/just:inline">
            Nota anterior → acordada, com o registro do gestor.
          </span>
        </p>
      </summary>

      <div className="mt-3 flex flex-col [&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:inset-x-0 [&>*+*]:before:top-0 [&>*+*]:before:h-px [&>*+*]:before:bg-border/60 [&>*+*]:before:content-['']">
        {temasComTexto.map((tema) => {
          const antes = avaliacao.previous[tema.id]
          const agora = niveisAtuais[tema.id]
          return (
            <div key={tema.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:gap-4">
              {/* self-start: sem isso o rótulo estica com a linha e o
                  `items-center` o centra verticalmente contra um parágrafo de
                  seis linhas, deixando "4 → 5 Tecnologia" flutuando no meio do
                  texto em vez de encabeçá-lo. */}
              <div className="flex shrink-0 items-center gap-2 sm:w-44 sm:self-start">
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {antes ?? "—"}
                </span>
                <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                <span className="font-mono text-sm tabular-nums text-foreground">{agora}</span>
                <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                  {tema.label}
                </span>
              </div>
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
                {avaliacao.rationale[tema.id]}
              </p>
            </div>
          )
        })}
      </div>
    </details>
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

  const soNome = (rotulo: string) => rotulo.split(" — ")[0]

  return (
    // Recolhido por padrão: era o maior bloco do cartão, 438px de 1266, e é
    // leitura de segundo nível — a nota comportamental já aparece como métrica
    // acima. O resumo na própria linha diz o suficiente para decidir se abre.
    <details className="group/comp @container/comportamental">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <Overline size="sm" className="flex items-center gap-1.5">
          <ChevronRight className="size-3 shrink-0 transition-transform group-open/comp:rotate-90" />
          Skills comportamentais
        </Overline>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="group-open/comp:hidden">
            {dimensoes.length} dimensões · maior {forcas[0]?.score.toFixed(1)} em{" "}
            {soNome(forcas[0]?.label ?? "")} · menor {aDesenvolver[0]?.score.toFixed(1)} em{" "}
            {soNome(aDesenvolver[0]?.label ?? "")}
          </span>
          <span className="hidden group-open/comp:inline">
            Média das avaliações dos formulários deste processo, de 0 a 5.
          </span>
        </p>
      </summary>

      {/* minmax(0,1fr) e não 1fr: em grade, `1fr` tem min-width auto, então a
          coluna das barras crescia até caber o rótulo mais longo por inteiro e
          empurrava a coluna de Forças 181px para fora do cartão. Medido. */}
      <div className="mt-4 grid gap-4 @xl/comportamental:grid-cols-[minmax(0,1fr)_14rem]">
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
    </details>
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

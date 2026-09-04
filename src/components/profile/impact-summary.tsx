import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { MetricCard } from "@/components/ui/metric-card"
import type { ImpactSummary } from "@/lib/profile/derive"
import { Overline } from "@/components/ui/overline"

export function ImpactSummarySection({ summary }: { summary: ImpactSummary }) {
  // As cinco medidas derivam dos MESMOS registros: sem registro, as cinco sao 0.
  const semNada =
    summary.totalRecords === 0 &&
    summary.projectCount === 0 &&
    summary.strategicCount === 0 &&
    summary.leadershipCount === 0 &&
    summary.mentorshipCount === 0

  return (
    <section>
      <Overline render={<h2 />} className="mb-2 text-muted-foreground/70">
        Resumo de impacto
      </Overline>
      {/* Conta vazia vira UMA linha, nao cinco numeros grandes.
          Cinco tiles de 102px diziam `0` na faixa mais larga da tela, entre a
          identidade e a trilha — 331px em duas colunas no mobile. Numero grande
          e tratamento para figura que E o assunto; cinco zeros nao sao assunto,
          e nao dizem o que fazer para deixarem de ser zero.

          Tentei o EmptyStateCard primeiro, que e o componente do sistema para
          regiao vazia. Media 232px: no desktop a faixa DOBROU. A forma dele
          (icone, pilha centralizada, py-8) serve a uma regiao que esta vazia,
          nao a uma faixa de resumo que por ora nao tem o que resumir — essa
          deve sussurrar. Mesma linguagem de superficie (tracejado, muted), uma
          fileira.

          Com UM registro a grade volta inteira, porque ai os numeros informam. */}
      {semNada ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-dashed border-border/80 bg-muted/[0.16] px-5 py-3.5">
          {/* Curta o bastante para o link caber ao lado. A frase diz de onde
              as cinco medidas vem; o link diz o que fazer. Na versao longa ela
              dizia as duas coisas, enchia a fileira e empurrava o link para
              baixo — 77px em vez de 54px, e a fileira deixava de ser fileira. */}
          <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">
            As cinco medidas saem dos seus registros.
          </p>
          <Link
            href="/professional/timeline"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
          >
            Ir para Registros
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard variant="tile" label="Registros" value={summary.totalRecords} />
          <MetricCard variant="tile" label="Projetos" value={summary.projectCount} />
          <MetricCard variant="tile" label="Iniciativas estratégicas" value={summary.strategicCount} />
          <MetricCard variant="tile" label="Ações de liderança" value={summary.leadershipCount} />
          <MetricCard variant="tile" label="Mentorias" value={summary.mentorshipCount} />
        </div>
      )}
    </section>
  )
}

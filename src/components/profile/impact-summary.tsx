import { MetricCard } from "@/components/ui/metric-card"
import type { ImpactSummary } from "@/lib/profile/derive"
import { Overline } from "@/components/ui/overline"

export function ImpactSummarySection({ summary }: { summary: ImpactSummary }) {
  return (
    <section>
      <Overline render={<h2 />} className="mb-2 text-muted-foreground/70">
        Resumo de impacto
      </Overline>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard variant="tile" label="Registros" value={summary.totalRecords} />
        <MetricCard variant="tile" label="Projetos" value={summary.projectCount} />
        <MetricCard variant="tile" label="Iniciativas estratégicas" value={summary.strategicCount} />
        <MetricCard variant="tile" label="Ações de liderança" value={summary.leadershipCount} />
        <MetricCard variant="tile" label="Mentorias" value={summary.mentorshipCount} />
      </div>
    </section>
  )
}

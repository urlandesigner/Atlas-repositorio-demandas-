import type { ImpactSummary } from "@/lib/profile/derive"

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-4 py-3">
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function ImpactSummarySection({ summary }: { summary: ImpactSummary }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
        Resumo de impacto
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat value={summary.totalRecords} label="Registros" />
        <Stat value={summary.projectCount} label="Projetos" />
        <Stat value={summary.strategicCount} label="Iniciativas estratégicas" />
        <Stat value={summary.leadershipCount} label="Ações de liderança" />
        <Stat value={summary.mentorshipCount} label="Mentorias" />
      </div>
    </section>
  )
}

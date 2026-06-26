import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TimelineGroup } from "@/lib/profile/derive"

export function ProfessionalTimeline({
  groups,
  onOpenItem,
}: {
  groups: TimelineGroup[]
  onOpenItem: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Trajetória profissional</CardTitle>
        <p className="text-xs text-muted-foreground">
          Seus registros mais recentes, consolidados por mês
        </p>
      </CardHeader>
      <CardContent>
        {groups.length ? (
          <div className="flex flex-col gap-5">
            {groups.map((group) => (
              <div key={group.monthLabel}>
                <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                  {group.monthLabel}
                </p>
                <div className="relative flex flex-col gap-1 border-l border-border/70 pl-4">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenItem(item.id)}
                      className="group relative -ml-4 flex items-center gap-3 rounded-lg py-1.5 pr-2 pl-4 text-left transition-colors hover:bg-muted/45"
                    >
                      <span className="absolute -left-[5px] size-2 rounded-full bg-brand ring-2 ring-card" />
                      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                      <Badge variant="outline" className="shrink-0 font-normal">
                        {item.roleLabel}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Seus registros aparecerão aqui, organizados pela sua trajetória.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

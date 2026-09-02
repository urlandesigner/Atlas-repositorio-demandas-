import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ListRowButton } from "@/components/ui/list-row-button"
import { Overline } from "@/components/ui/overline"
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
                <Overline className="mb-2 text-muted-foreground/70">
                  {group.monthLabel}
                </Overline>
                <div className="relative flex flex-col gap-1 border-l border-border/70 pl-4">
                  {group.items.map((item) => (
                    <ListRowButton
                      key={item.id}
                      onClick={() => onOpenItem(item.id)}
                      className="relative -ml-4 items-center border-transparent bg-transparent py-1.5 pr-2 pl-4"
                    >
                      <span className="absolute -left-[5px] size-2 rounded-full bg-brand ring-2 ring-card" />
                      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                      <Badge variant="outline" className="shrink-0">
                        {item.roleLabel}
                      </Badge>
                    </ListRowButton>
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

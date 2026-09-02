"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ListRowButton } from "@/components/ui/list-row-button"
import type { RecordEntry } from "@/lib/records/types"
import { getRecordImpactText } from "@/lib/records/display"
import type { CompetencyEvidenceView } from "@/lib/evolution/types"

export function EvidenceSheet({
  view,
  records,
  open,
  onOpenChange,
  onOpenRecord,
}: {
  view: CompetencyEvidenceView | null
  records: RecordEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenRecord: (record: RecordEntry) => void
}) {
  const linked = view
    ? records.filter((r) => view.linkedRecordIds.includes(r.id))
    : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto" size="md">
        {view ? (
          <>
            <SheetHeader>
              <SheetTitle>{view.label}</SheetTitle>
              <SheetDescription>
                {view.evidenceCount} evidências identificadas nos seus registros.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-2 p-4 pt-0">
              {linked.length ? (
                linked.map((record) => (
                  <ListRowButton
                    key={record.id}
                    onClick={() => onOpenRecord(record)}
                    className="rounded-xl p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{record.enriched.title || "Registro"}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {getRecordImpactText(record)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-3xs">
                          Impacto {record.impactLevel}
                        </Badge>
                        <Badge variant="outline" className="text-3xs">
                          {record.atuacao}
                        </Badge>
                      </div>
                    </div>
                  </ListRowButton>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma evidência vinculada ainda. Registre entregas que demonstrem esta competência.
                </p>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

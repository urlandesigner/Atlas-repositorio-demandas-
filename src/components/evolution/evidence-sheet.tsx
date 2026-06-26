"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
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
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
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
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onOpenRecord(record)}
                    className="rounded-xl border border-border/60 p-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium">{record.enriched.title || "Registro"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {getRecordImpactText(record)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        Impacto {record.impactLevel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {record.atuacao}
                      </Badge>
                    </div>
                  </button>
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

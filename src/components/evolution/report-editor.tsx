"use client"

import { useState } from "react"
import { Copy, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ReportSnapshot } from "@/lib/evolution/types"
import { reportToMarkdown } from "@/lib/evolution/reports"
import { cn } from "@/lib/utils"

export function ReportEditor({
  report,
  onUpdateSection,
  onRegenerate,
  regenerating,
}: {
  report: ReportSnapshot
  onUpdateSection: (sectionId: string, content: string) => void
  onRegenerate?: () => void
  regenerating?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copyMarkdown() {
    await navigator.clipboard.writeText(reportToMarkdown(report))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Última edição {new Date(report.lastEditedAt).toLocaleString("pt-BR")}
        </p>
        <div className="flex gap-2">
          {onRegenerate ? (
            <Button variant="outline" size="sm" onClick={onRegenerate} disabled={regenerating}>
              {regenerating ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                <Sparkles className="size-4" data-icon="inline-start" />
              )}
              Refinar com IA
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={copyMarkdown}>
            <Copy className="size-4" data-icon="inline-start" />
            {copied ? "Copiado" : "Copiar Markdown"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {report.sections.map((section) => (
          <section
            key={section.id}
            className="rounded-[12px] border border-border/60 bg-card/[0.98] p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">{section.title}</h3>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  section.source === "user"
                    ? "text-foreground/70"
                    : section.source === "ai"
                      ? "text-brand-muted-foreground"
                      : "text-muted-foreground"
                )}
              >
                {section.source === "user"
                  ? "Editado"
                  : section.source === "ai"
                    ? "IA"
                    : "Automático"}
              </span>
            </div>
            <Textarea
              value={section.content}
              onChange={(e) => onUpdateSection(section.id, e.target.value)}
              rows={Math.min(12, Math.max(4, section.content.split("\n").length + 1))}
              className="min-h-[100px] resize-y text-sm leading-relaxed"
            />
          </section>
        ))}
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProfileInsights } from "@/lib/profile/derive"
import { computePdiInsights, type PdiTheme } from "@/lib/profile/pdi"

function InsightGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
        {label}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export function AiInsightsPanel({
  current,
  expected,
}: {
  current: Record<PdiTheme, number>
  expected: Record<PdiTheme, number>
}) {
  // Baseline determinístico sobre a matriz: sempre disponível, sem depender da IA.
  const baseline = useMemo(() => computePdiInsights(current, expected), [current, expected])
  const [insights, setInsights] = useState<ProfileInsights>(baseline)

  useEffect(() => {
    setInsights(baseline)
    if (!baseline.highlights.length && !baseline.opportunities.length) return

    const controller = new AbortController()
    fetch("/api/profile/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseline }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.insights) setInsights(data.insights as ProfileInsights)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [baseline])

  const isEmpty = !insights.highlights.length && !insights.opportunities.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-4 text-brand" />
          Insights da IA
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isEmpty ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Defina os níveis esperados na matriz para a IA apontar forças e gaps.
          </p>
        ) : (
          <>
            {insights.highlights.length ? (
              <InsightGroup label="Destaques">
                {insights.highlights.map((insight) => (
                  <div key={insight.id} className="flex gap-2 text-sm leading-snug">
                    <TrendingUp className="mt-0.5 size-4 shrink-0 text-brand-muted-foreground" />
                    <span>{insight.text}</span>
                  </div>
                ))}
              </InsightGroup>
            ) : null}

            {insights.opportunities.length ? (
              <InsightGroup label="Oportunidades">
                {insights.opportunities.map((insight) => (
                  <div key={insight.id} className="flex gap-2 text-sm leading-snug">
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {insight.text}
                      {insight.suggestedObjective ? (
                        <>
                          {" "}
                          <Link
                            href="/professional/objectives"
                            className="text-brand-muted-foreground underline-offset-2 hover:underline"
                          >
                            + criar objetivo
                          </Link>
                        </>
                      ) : null}
                    </span>
                  </div>
                ))}
              </InsightGroup>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

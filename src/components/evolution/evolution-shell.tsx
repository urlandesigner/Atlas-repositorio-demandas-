"use client"

import { PageHeader } from "@/components/ui/page-header"

import { EvolutionNav, EvolutionNavMobile } from "./evolution-nav"

export function EvolutionShell({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      {title ? (
        <header>
          <PageHeader
            title={title}
            description={description}
            descriptionClassName="max-w-2xl"
          />
        </header>
      ) : null}

      <EvolutionNavMobile />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="hidden w-48 shrink-0 lg:block">
          <EvolutionNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

"use client"

import { PageHeaderActions } from "@/components/shell/page-header-actions"
import { PageHeader } from "@/components/ui/page-header"

import { EvolutionNav, EvolutionNavMobile } from "./evolution-nav"

export function EvolutionShell({
  title,
  description,
  actions,
  children,
}: {
  title?: string
  description?: string
  /**
   * CTA primário da página, no cluster do cabeçalho — a posição padrão do app.
   *
   * Existe porque não existia: sem slot, quem tinha CTA o colocava num
   * `flex justify-end` dentro do conteúdo, e ele descia para a altura da coluna
   * de navegação, longe do título e desalinhado de todas as outras telas.
   * Acontecia em Reconhecimentos e Apresentações.
   */
  actions?: React.ReactNode
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
          >
            {actions ? <PageHeaderActions>{actions}</PageHeaderActions> : null}
          </PageHeader>
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

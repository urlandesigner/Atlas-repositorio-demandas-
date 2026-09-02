import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Cabeçalho de página: título + descrição à esquerda, ações à direita
 * (empilhadas no mobile). Passe as ações como children — normalmente um
 * <PageHeaderActions>, que já traz o próprio cluster com o sino.
 * Use `render` quando a página precisa de <header> semântico.
 */
function PageHeader({
  title,
  description,
  descriptionClassName,
  leading,
  meta,
  children,
  className,
  ...props
}: {
  title: React.ReactNode
  description?: React.ReactNode
  descriptionClassName?: string
  /** Avatar ou ícone antes do título — para páginas que abrem uma entidade. */
  leading?: React.ReactNode
  /** Badges e atributos logo abaixo da descrição. */
  meta?: React.ReactNode
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-4">
        {leading}
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className={cn("mt-1 text-sm text-muted-foreground", descriptionClassName)}>
              {description}
            </p>
          ) : null}
          {meta ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  )
}

export { PageHeader }

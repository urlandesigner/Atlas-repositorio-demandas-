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
  children,
  className,
  ...props
}: {
  title: React.ReactNode
  description?: React.ReactNode
  descriptionClassName?: string
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
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className={cn("mt-1 text-sm text-muted-foreground", descriptionClassName)}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export { PageHeader }

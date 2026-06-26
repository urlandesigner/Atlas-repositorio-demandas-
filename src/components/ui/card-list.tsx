import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Card sem padding/gap externos — cabeçalho e lista ficam colados à borda. */
export function CardList({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return <Card className={cn("gap-0 py-0", className)} {...props} />
}

/** Cabeçalho para cards cujo conteúdo principal é uma lista — título acima do peso das linhas. */
export function CardListHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <CardHeader
      className={cn("border-b border-border/60 px-4 pt-4 pb-3.5", className)}
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
    </CardHeader>
  )
}

export function CardListBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <CardContent className={cn("p-0", className)}>{children}</CardContent>
}

export function CardListRows({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("divide-y divide-border/60", className)}>{children}</div>
}

export function CardListRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Título de linha — menor e mais leve que o título do card. */
export function CardListRowTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-sm font-medium leading-snug text-foreground/90", className)}>
      {children}
    </p>
  )
}

export function CardListRowMeta({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn("mt-1 text-xs leading-relaxed text-muted-foreground", className)}>
      {children}
    </p>
  )
}

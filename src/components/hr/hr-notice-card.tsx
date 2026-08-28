"use client"

import Link from "next/link"
import { ArrowUpRight, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { CardListRow, CardListRowMeta, CardListRowTitle } from "@/components/ui/card-list"
import { cn } from "@/lib/utils"
import type { HrNotice } from "@/lib/hr/store"

function formatNoticeDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export function HrNoticeCard({
  notice,
  isUnread = false,
  onMarkRead,
  preview = false,
  compact = false,
}: {
  notice: HrNotice
  isUnread?: boolean
  onMarkRead?: () => void
  preview?: boolean
  compact?: boolean
}) {
  return (
    <CardListRow className={compact ? "gap-2 py-3 lg:flex-col lg:items-start" : undefined}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <CardListRowTitle>{notice.title}</CardListRowTitle>
          {isUnread ? <Badge variant="primary-soft">Novo</Badge> : null}
          {notice.pinned ? <Badge variant="outline">Destaque</Badge> : null}
          <Badge variant="outline">{notice.category}</Badge>
        </div>
        <CardListRowMeta className={compact ? "line-clamp-1" : undefined}>
          {notice.body}
        </CardListRowMeta>
      </div>

      <div
        className={cn(
          "flex flex-col items-start gap-2",
          !compact && "lg:items-end"
        )}
      >
        {notice.ctaHref && notice.ctaLabel ? (
          <Link
            href={notice.ctaHref}
            onClick={onMarkRead}
            className={buttonVariants({ variant: "outline", size: "xs" })}
          >
            {notice.ctaLabel}
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatNoticeDate(notice.publishedAt)}</span>
          {!preview && !compact && isUnread ? (
            <Button variant="ghost" size="sm" onClick={onMarkRead}>
              <Check data-icon="inline-start" />
              Marcar como lido
            </Button>
          ) : null}
        </div>
      </div>
    </CardListRow>
  )
}

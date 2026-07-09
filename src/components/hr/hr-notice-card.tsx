"use client"

import Link from "next/link"
import { ArrowUpRight, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { CardListRow, CardListRowMeta, CardListRowTitle } from "@/components/ui/card-list"
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
}: {
  notice: HrNotice
  isUnread?: boolean
  onMarkRead?: () => void
  preview?: boolean
}) {
  return (
    <CardListRow>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <CardListRowTitle>{notice.title}</CardListRowTitle>
          {isUnread ? <Badge variant="default">Novo</Badge> : null}
          {notice.pinned ? <Badge variant="secondary">Destaque</Badge> : null}
          <Badge variant="outline">{notice.category}</Badge>
        </div>
        <CardListRowMeta>{notice.body}</CardListRowMeta>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <span className="text-xs text-muted-foreground">{formatNoticeDate(notice.publishedAt)}</span>
        {notice.ctaHref && notice.ctaLabel ? (
          <Link
            href={notice.ctaHref}
            onClick={onMarkRead}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {notice.ctaLabel}
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        ) : null}
        {!preview && isUnread ? (
          <Button variant="ghost" size="sm" onClick={onMarkRead}>
            <Check data-icon="inline-start" />
            Marcar como lido
          </Button>
        ) : null}
      </div>
    </CardListRow>
  )
}

"use client"

import Link from "next/link"
import { ArrowUpRight, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { CardListItem } from "@/components/ui/card-list"
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
    <CardListItem
      className={compact ? "py-3" : undefined}
      badges={
        <>
          {isUnread ? <Badge variant="primary-soft">Novo</Badge> : null}
          <Badge variant="outline">{notice.category}</Badge>
        </>
      }
      title={notice.title}
      text={notice.body}
      action={
        notice.ctaHref && notice.ctaLabel ? (
          <Link
            href={notice.ctaHref}
            onClick={onMarkRead}
            className={buttonVariants({ variant: "outline", size: "xs" })}
          >
            {notice.ctaLabel}
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        ) : null
      }
      date={
        <span className="inline-flex items-center gap-3">
          {formatNoticeDate(notice.publishedAt)}
          {/* Também no modo compacto: era a única variante renderizada no app, e
              sem esta ação um aviso sem CTA nunca podia ser lido — o "Novo"
              ficava para sempre. Vive na linha da data para não quebrar a ordem
              badge/título/texto/data. */}
          {!preview && isUnread && onMarkRead ? (
            <button
              type="button"
              onClick={onMarkRead}
              className="inline-flex items-center gap-1 font-medium text-accent-ink hover:underline"
            >
              <Check className="size-3" />
              Marcar como lido
            </button>
          ) : null}
        </span>
      }
    />
  )
}

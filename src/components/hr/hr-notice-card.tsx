"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { CardListItem } from "@/components/ui/card-list"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { HrNotice } from "@/lib/hr/store"

function formatNoticeDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatShortDate(value: string) {
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
  const [open, setOpen] = useState(false)

  const row = (
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
      date={formatShortDate(notice.publishedAt)}
    />
  )

  // No preview do admin a linha é ilustração, não afordância: abrir um modal ali
  // colocaria o editor dentro do que ele está editando.
  if (preview) return row

  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Abrir é o ato de ler. Por isso não existe um botão separado de
          // "marcar como lido": ele obrigaria a pessoa a confirmar algo que ela
          // acabou de fazer, e deixava sem saída os avisos que não têm CTA.
          onMarkRead?.()
          setOpen(true)
        }}
        className="block w-full cursor-pointer text-left transition-colors hover:bg-muted/40"
        aria-label={`Abrir aviso: ${notice.title}`}
      >
        {row}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pr-8">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{notice.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatNoticeDate(notice.publishedAt)}
              </span>
            </div>
            <DialogTitle className="text-base leading-snug">{notice.title}</DialogTitle>
          </DialogHeader>

          {/* Sem line-clamp e com whitespace preservado: o modal existe para ser
              o lugar onde o aviso aparece inteiro, inclusive as quebras que o RH
              escreveu. */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
            {notice.body}
          </p>

          {/* Rodapé só quando há CTA: o X do canto já fecha, e um "Fechar"
              sozinho seria um segundo caminho competindo com ele. */}
          {notice.ctaHref && notice.ctaLabel ? (
            <DialogFooter showCloseButton>
              <Link
                href={notice.ctaHref}
                onClick={() => setOpen(false)}
                className={buttonVariants({ size: "sm" })}
              >
                {notice.ctaLabel}
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

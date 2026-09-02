"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowUpRight, FilePlus2, Pencil, Plus, Trash2 } from "lucide-react"

import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { RecognitionFormSheet } from "@/components/evolution/recognition-form-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RECOGNITION_TYPE_LABEL,
  type RecognitionDraft,
  type RecognitionEntry,
} from "@/lib/evolution/types"
import {
  buildRecognitionDraftFromKudo,
  filterKudosNotYetEvidence,
} from "@/lib/evolution/kudo-to-recognition"
import {
  addRecognition,
  deleteRecognition,
  updateRecognition,
} from "@/lib/evolution/recognitions-store"
import {
  getKudosReceived,
  getOrgSocialServerSnapshot,
  getOrgSocialSnapshot,
  KUDO_TYPE_META,
  subscribeOrgSocialStore,
} from "@/lib/org/social"
import {
  getOrgServerSnapshot,
  getOrgSnapshot,
  subscribeOrgStore,
} from "@/lib/org/store"
import { useEvolutionData } from "@/hooks/use-evolution-data"
import { useOptionalSession } from "@/hooks/use-optional-session"

/**
 * `RecognitionEntry.date` é data-only (YYYY-MM-DD). `new Date("2026-06-28")`
 * parseia como meia-noite UTC e, em BRT, volta um dia — a entrada convertida de
 * um elogio de 28/06 aparecia como 27/06. O `T00:00:00` força hora local, que é
 * a convenção já usada nas outras telas de data-only.
 */
function formatEntryDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR")
}

export default function EvolutionRecognitionsPage() {
  const { recognitions } = useEvolutionData()
  const session = useOptionalSession()
  const social = useSyncExternalStore(
    subscribeOrgSocialStore,
    getOrgSocialSnapshot,
    getOrgSocialServerSnapshot
  )
  const org = useSyncExternalStore(subscribeOrgStore, getOrgSnapshot, getOrgServerSnapshot)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RecognitionEntry | null>(null)
  const [draft, setDraft] = useState<RecognitionDraft | null>(null)

  // Elogios da rede que ainda não viraram evidência. O mesmo conceito de
  // "reconhecimento" vive em dois stores, e espelhar aqui evita o perfil dizer
  // "zero" enquanto a rede mostra kudos. Os já convertidos saem desta lista e
  // aparecem acima como reconhecimento de verdade.
  const kudosReceived = session ? getKudosReceived(social, session.userId) : []
  const pendingKudos = filterKudosNotYetEvidence(kudosReceived, recognitions)
  const userById = new Map(org.users.map((user) => [user.id, user]))
  const hasAnyRecognition = recognitions.length > 0 || pendingKudos.length > 0

  function handleSubmit(data: RecognitionDraft) {
    if (editing) {
      updateRecognition(editing.id, data)
    } else {
      addRecognition(data)
    }
    setEditing(null)
    setDraft(null)
  }

  function openBlankForm() {
    setEditing(null)
    setDraft(null)
    setOpen(true)
  }

  return (
    <EvolutionShell
      title="Reconhecimentos"
      description="Feedbacks e validações recebidos como evidência de carreira."
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={openBlankForm}>
            <Plus data-icon="inline-start" />
            Registrar reconhecimento
          </Button>
        </div>

        {hasAnyRecognition ? (
          <div className="flex flex-col gap-6">
            {recognitions.length ? (
              <div className="flex flex-col gap-3">
                {recognitions.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-border/60 bg-card/[0.98] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium">{item.title}</h3>
                          <Badge variant="outline">
                            {RECOGNITION_TYPE_LABEL[item.type]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.recognizedBy}
                          {item.recognizerArea ? ` · ${item.recognizerArea}` : ""} ·{" "}
                          {formatEntryDate(item.date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditing(item)
                            setOpen(true)
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteRecognition(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {pendingKudos.length ? (
              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-medium">Elogios da rede</h2>
                      <Badge variant="secondary">
                        {pendingKudos.length}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ainda não usados como evidência de carreira.
                    </p>
                  </div>
                  <Link
                    href="/people"
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
                  >
                    Ver na rede
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
                {pendingKudos.map((kudo) => {
                  const meta = KUDO_TYPE_META[kudo.type]
                  const from = userById.get(kudo.fromUserId)
                  const fromName = from?.name ?? "Alguém da rede"

                  return (
                    <article
                      key={kudo.id}
                      className="rounded-lg border border-border/60 bg-card/[0.98] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm"
                        >
                          {meta.emoji}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-medium">{meta.label}</h3>
                            <Badge variant="secondary">
                              da rede
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {fromName} · {new Date(kudo.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            “{kudo.message}”
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(null)
                            setDraft(
                              buildRecognitionDraftFromKudo({ kudo, from, areas: org.areas })
                            )
                            setOpen(true)
                          }}
                        >
                          <FilePlus2 data-icon="inline-start" />
                          Usar como evidência
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </section>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum reconhecimento registrado. Salve elogios e feedbacks que reforçam sua trajetória.
            </p>
          </div>
        )}
      </div>

      <RecognitionFormSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setEditing(null)
            setDraft(null)
          }
        }}
        editing={editing}
        draft={draft}
        onSubmit={handleSubmit}
      />
    </EvolutionShell>
  )
}

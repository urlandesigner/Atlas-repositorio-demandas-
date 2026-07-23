"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react"

import { EvolutionShell } from "@/components/evolution/evolution-shell"
import { RecognitionFormSheet } from "@/components/evolution/recognition-form-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RECOGNITION_TYPE_LABEL,
  type RecognitionEntry,
} from "@/lib/evolution/types"
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

  // Kudos recebidos pelo usuário logado na rede interna (read-only): o mesmo
  // conceito de "reconhecimento" vive em dois stores, então espelhamos aqui
  // para o perfil não dizer "zero" enquanto a rede mostra kudos.
  const kudosReceived = session ? getKudosReceived(social, session.userId) : []
  const userNameById = new Map(org.users.map((user) => [user.id, user.name]))
  const hasAnyRecognition = recognitions.length > 0 || kudosReceived.length > 0

  function handleSubmit(data: Omit<RecognitionEntry, "id" | "createdAt" | "updatedAt">) {
    if (editing) {
      updateRecognition(editing.id, data)
    } else {
      addRecognition(data)
    }
    setEditing(null)
  }

  return (
    <EvolutionShell
      title="Reconhecimentos"
      description="Feedbacks e validações recebidos como evidência de carreira."
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
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
                    className="rounded-[12px] border border-border/60 bg-card/[0.98] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium">{item.title}</h3>
                          <Badge variant="outline" className="font-normal">
                            {RECOGNITION_TYPE_LABEL[item.type]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.recognizedBy}
                          {item.recognizerArea ? ` · ${item.recognizerArea}` : ""} ·{" "}
                          {new Date(item.date).toLocaleDateString("pt-BR")}
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

            {kudosReceived.length ? (
              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium">Recebidos na rede</h2>
                    <Badge variant="secondary" className="font-normal">
                      {kudosReceived.length}
                    </Badge>
                  </div>
                  <Link
                    href="/people"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    Ver na rede
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
                {kudosReceived.map((kudo) => {
                  const meta = KUDO_TYPE_META[kudo.type]
                  const fromName = userNameById.get(kudo.fromUserId) ?? "Alguém da rede"

                  return (
                    <article
                      key={kudo.id}
                      className="rounded-[12px] border border-border/60 bg-card/[0.98] p-4"
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
                            <Badge variant="secondary" className="font-normal">
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
                    </article>
                  )
                })}
              </section>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-border/80 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum reconhecimento registrado. Salve elogios e feedbacks que reforçam sua trajetória.
            </p>
          </div>
        )}
      </div>

      <RecognitionFormSheet
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSubmit={handleSubmit}
      />
    </EvolutionShell>
  )
}

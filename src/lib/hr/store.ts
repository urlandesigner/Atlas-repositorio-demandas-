import type { UserRole } from "@/lib/org/types"

export interface HrNotice {
  id: string
  areaId: string | null
  title: string
  body: string
  category: "Processos" | "Benefícios" | "Comunicados"
  audience: UserRole | "all"
  ctaLabel?: string | null
  ctaHref?: string | null
  publishedAt: string
  pinned?: boolean
}

export const HR_NOTICES_STORAGE_KEY = "atlas_hr_notices"
export const HR_NOTICES_STORAGE_EVENT = "atlas-hr-notices-change"
export const HR_NOTICE_READS_STORAGE_KEY = "atlas_hr_notice_reads"
export const HR_NOTICE_READS_STORAGE_EVENT = "atlas-hr-notice-reads-change"

export interface HrNoticeReadEntry {
  userId: string
  noticeId: string
  readAt: string
}

const HR_NOTICES_SEED: HrNotice[] = [
  {
    id: "hr-notice-feedback-cycle",
    areaId: "area-tecnologia",
    title: "Ciclo de feedback do semestre aberto",
    body:
      "Até 19/07, registre seus principais avanços e alinhe com sua liderança os pontos que devem entrar na conversa formal.",
    category: "Processos",
    audience: "all",
    ctaLabel: "Abrir perfil",
    ctaHref: "/professional/profile",
    publishedAt: "2026-07-05T09:00:00.000Z",
    pinned: true,
  },
  {
    id: "hr-notice-benefits-window",
    areaId: "area-tecnologia",
    title: "Janela de atualização de benefícios",
    body:
      "Mudanças de dependentes e escolha de benefícios flexíveis ficam disponíveis até o fim do mês.",
    category: "Benefícios",
    audience: "all",
    publishedAt: "2026-07-03T09:00:00.000Z",
  },
  {
    id: "hr-notice-leadership-ritual",
    areaId: "area-tecnologia",
    title: "Gestores: reforço do ritual de 1:1",
    body:
      "Garanta a cadência das conversas do mês e registre os principais pontos no relatório para manter histórico e contexto.",
    category: "Comunicados",
    audience: "gestor",
    ctaLabel: "Abrir gestão",
    ctaHref: "/gestao",
    publishedAt: "2026-07-01T09:00:00.000Z",
  },
]

let cached: HrNotice[] | null = null
let cachedReads: HrNoticeReadEntry[] | null = null

function isClient() {
  return typeof window !== "undefined"
}

function normalize(data: unknown): HrNotice[] {
  if (!Array.isArray(data)) return HR_NOTICES_SEED
  return data.flatMap((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("id" in entry) ||
      !("title" in entry) ||
      !("body" in entry) ||
      !("category" in entry) ||
      !("audience" in entry) ||
      !("publishedAt" in entry)
    ) {
      return []
    }

    const raw = entry as Partial<HrNotice>
    return [
      {
        id: raw.id ?? crypto.randomUUID(),
        areaId: raw.areaId ?? "area-tecnologia",
        title: raw.title ?? "",
        body: raw.body ?? "",
        category: raw.category ?? "Comunicados",
        audience: raw.audience ?? "all",
        ctaLabel: raw.ctaLabel ?? null,
        ctaHref: raw.ctaHref ?? null,
        publishedAt: raw.publishedAt ?? new Date().toISOString(),
        pinned: Boolean(raw.pinned),
      },
    ]
  })
}

export function getHrNoticesSnapshot() {
  if (!isClient()) return HR_NOTICES_SEED
  if (cached) return cached

  const raw = localStorage.getItem(HR_NOTICES_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(HR_NOTICES_STORAGE_KEY, JSON.stringify(HR_NOTICES_SEED))
    cached = HR_NOTICES_SEED
    return cached
  }

  try {
    cached = normalize(JSON.parse(raw))
    return cached
  } catch {
    cached = HR_NOTICES_SEED
    return cached
  }
}

export function getHrNoticesServerSnapshot() {
  return HR_NOTICES_SEED
}

export function getHrNoticeReadsSnapshot() {
  if (!isClient()) return []
  if (cachedReads) return cachedReads

  const raw = localStorage.getItem(HR_NOTICE_READS_STORAGE_KEY)
  if (!raw) {
    cachedReads = []
    return cachedReads
  }

  try {
    cachedReads = JSON.parse(raw) as HrNoticeReadEntry[]
    return cachedReads
  } catch {
    cachedReads = []
    return cachedReads
  }
}

export function getHrNoticeReadsServerSnapshot() {
  return []
}

function save(data: HrNotice[]) {
  if (!isClient()) return
  cached = data
  localStorage.setItem(HR_NOTICES_STORAGE_KEY, JSON.stringify(cached))
}

function saveReads(data: HrNoticeReadEntry[]) {
  if (!isClient()) return
  cachedReads = data
  localStorage.setItem(HR_NOTICE_READS_STORAGE_KEY, JSON.stringify(cachedReads))
}

export function emitHrNoticesChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(HR_NOTICES_STORAGE_EVENT))
}

export function emitHrNoticeReadsChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(HR_NOTICE_READS_STORAGE_EVENT))
}

export function subscribeHrNoticesStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(HR_NOTICES_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(HR_NOTICES_STORAGE_EVENT, handler)
  }
}

export function subscribeHrNoticeReadsStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(HR_NOTICE_READS_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(HR_NOTICE_READS_STORAGE_EVENT, handler)
  }
}

export function getHrNoticesForRole(
  role: UserRole | undefined,
  areaId: string | null | undefined,
  notices: HrNotice[]
) {
  return notices
    .filter((notice) => notice.areaId === areaId)
    .filter((notice) => notice.audience === "all" || notice.audience === role)
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
      return b.publishedAt.localeCompare(a.publishedAt)
    })
}

export function createHrNotice(
  input: Omit<HrNotice, "id">
) {
  const entry: HrNotice = {
    ...input,
    id: crypto.randomUUID(),
  }
  save([entry, ...getHrNoticesSnapshot()])
  emitHrNoticesChange()
  return entry
}

export function updateHrNotice(
  id: string,
  updates: Partial<Omit<HrNotice, "id">>
) {
  const current = getHrNoticesSnapshot().find((entry) => entry.id === id)
  if (!current) {
    throw new Error("Aviso do RH não encontrado.")
  }

  const next: HrNotice = {
    ...current,
    ...updates,
  }

  save(getHrNoticesSnapshot().map((entry) => (entry.id === id ? next : entry)))
  emitHrNoticesChange()
  return next
}

export function deleteHrNotice(id: string) {
  save(getHrNoticesSnapshot().filter((entry) => entry.id !== id))
  saveReads(getHrNoticeReadsSnapshot().filter((entry) => entry.noticeId !== id))
  emitHrNoticesChange()
  emitHrNoticeReadsChange()
}

export function isHrNoticeUnread(
  userId: string | undefined,
  noticeId: string,
  reads: HrNoticeReadEntry[]
) {
  if (!userId) return false
  return !reads.some((entry) => entry.userId === userId && entry.noticeId === noticeId)
}

export function markHrNoticeRead(userId: string, noticeId: string) {
  const reads = getHrNoticeReadsSnapshot()
  const exists = reads.some((entry) => entry.userId === userId && entry.noticeId === noticeId)
  if (exists) return

  saveReads([
    {
      userId,
      noticeId,
      readAt: new Date().toISOString(),
    },
    ...reads,
  ])
  emitHrNoticeReadsChange()
}

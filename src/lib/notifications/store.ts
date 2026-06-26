export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  href: string | null
  read: boolean
  createdAt: string
}

export const NOTIFICATIONS_STORAGE_KEY = "atlas_notifications"
export const NOTIFICATIONS_STORAGE_EVENT = "atlas-notifications-change"

const MAX_NOTIFICATIONS = 100

let cached: AppNotification[] | null = null
const SERVER_SNAPSHOT: AppNotification[] = []

function isClient() {
  return typeof window !== "undefined"
}

export function getNotificationsSnapshot(): AppNotification[] {
  if (!isClient()) return []
  if (cached) return cached

  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
  if (!raw) {
    cached = []
    return cached
  }

  try {
    cached = JSON.parse(raw) as AppNotification[]
    return cached
  } catch {
    cached = []
    return cached
  }
}

export function getNotificationsServerSnapshot(): AppNotification[] {
  return SERVER_SNAPSHOT
}

function save(data: AppNotification[]) {
  if (!isClient()) return
  cached = data.slice(0, MAX_NOTIFICATIONS)
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(cached))
}

export function emitNotificationsChange() {
  if (!isClient()) return
  window.dispatchEvent(new Event(NOTIFICATIONS_STORAGE_EVENT))
}

export function subscribeNotificationsStore(onChange: () => void) {
  if (!isClient()) return () => {}

  const handler = () => onChange()
  window.addEventListener("storage", handler)
  window.addEventListener(NOTIFICATIONS_STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener(NOTIFICATIONS_STORAGE_EVENT, handler)
  }
}

export function getNotificationsForUser(userId: string): AppNotification[] {
  return getNotificationsSnapshot()
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function notifyUser(input: {
  userId: string
  title: string
  body: string
  href?: string | null
}) {
  const entry: AppNotification = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    read: false,
    createdAt: new Date().toISOString(),
  }

  save([entry, ...getNotificationsSnapshot()])
  emitNotificationsChange()
}

export function notifyUsers(
  userIds: string[],
  input: Omit<Parameters<typeof notifyUser>[0], "userId">
) {
  const unique = Array.from(new Set(userIds))
  unique.forEach((userId) => notifyUser({ ...input, userId }))
}

export function markNotificationRead(id: string) {
  save(
    getNotificationsSnapshot().map((entry) =>
      entry.id === id ? { ...entry, read: true } : entry
    )
  )
  emitNotificationsChange()
}

export function markAllNotificationsRead(userId: string) {
  save(
    getNotificationsSnapshot().map((entry) =>
      entry.userId === userId ? { ...entry, read: true } : entry
    )
  )
  emitNotificationsChange()
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "agora"
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days} dia${days > 1 ? "s" : ""}`
  return date.toLocaleDateString("pt-BR")
}

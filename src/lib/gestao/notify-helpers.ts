import { getOrgSnapshot, getOrgUserById } from "@/lib/org/store"
import { notifyUsers } from "@/lib/notifications/store"

export function getAreaAdminIds(areaId: string): string[] {
  return getOrgSnapshot()
    .users.filter((user) => user.areaId === areaId && user.role === "admin")
    .map((user) => user.id)
}

export function notifyAreaAdmins(
  areaId: string,
  input: Omit<Parameters<typeof notifyUsers>[1], "userId"> & { excludeUserId?: string }
) {
  const { excludeUserId, ...rest } = input
  const adminIds = getAreaAdminIds(areaId).filter((id) => id !== excludeUserId)
  if (adminIds.length) notifyUsers(adminIds, rest)
}

export function getUserDisplayName(userId: string): string {
  return getOrgUserById(userId)?.name ?? "Colaborador"
}

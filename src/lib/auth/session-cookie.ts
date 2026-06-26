export const SESSION_COOKIE_NAME = "atlas_session"
export const SESSION_STORAGE_KEY = "atlas_session"
export const SESSION_STORAGE_EVENT = "atlas-session-change"

export function encodeSessionCookie(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
}

export function decodeSessionCookie<T>(value: string): T | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8")
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

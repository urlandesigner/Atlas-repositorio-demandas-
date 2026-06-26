import type { HighlightPeriod } from "./types"

export function getPeriodRange(
  period: HighlightPeriod,
  now: Date = new Date()
): { start: Date; end: Date; label: string } {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  switch (period) {
    case "7d":
      start.setDate(start.getDate() - 6)
      break
    case "30d":
      start.setDate(start.getDate() - 29)
      break
    case "90d":
      start.setDate(start.getDate() - 89)
      break
    case "cycle":
      start.setMonth(start.getMonth() - 6)
      break
    case "quarter": {
      const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3
      start.setMonth(quarterStartMonth, 1)
      break
    }
    case "year":
      start.setMonth(0, 1)
      break
  }

  return { start, end, label: period }
}

export function isInPeriod(iso: string, period: HighlightPeriod, now: Date = new Date()): boolean {
  const { start, end } = getPeriodRange(period, now)
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t <= end.getTime()
}

export function getDaysRange(days: number, now: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return { start, end }
}

export function filterRecordsByRange(
  records: { createdAt: string }[],
  start: Date,
  end: Date
): typeof records {
  const s = start.getTime()
  const e = end.getTime()
  return records.filter((r) => {
    const t = new Date(r.createdAt).getTime()
    return t >= s && t <= e
  })
}

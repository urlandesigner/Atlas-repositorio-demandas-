const PDI_CADENCE_MONTHS = 6

export function getNextPdiDate(baselineAt: string, cadenceMonths = PDI_CADENCE_MONTHS) {
  const base = new Date(baselineAt)
  const next = new Date(base)
  next.setMonth(next.getMonth() + cadenceMonths)
  return next
}

export function formatPdiScheduleDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function getDaysUntilPdi(value: Date | string) {
  const target = typeof value === "string" ? new Date(value) : value
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const compare = new Date(target)
  compare.setHours(0, 0, 0, 0)

  return Math.ceil((compare.getTime() - today.getTime()) / 86400000)
}

export function getNextPdiStatusText(daysUntil: number) {
  if (daysUntil === 0) return "Vence hoje"
  if (daysUntil === 1) return "Falta 1 dia"
  if (daysUntil > 1) return `Faltam ${daysUntil} dias`
  if (daysUntil === -1) return "1 dia de atraso"
  return `${Math.abs(daysUntil)} dias de atraso`
}

export function getNextPdiTone(daysUntil: number) {
  if (daysUntil < 0) return "critical" as const
  if (daysUntil <= 14) return "warning" as const
  return "neutral" as const
}

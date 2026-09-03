import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const LIST_DATE_MONTHS = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
]

/**
 * Data para a linha de lista: `05 JUL`.
 *
 * Fonte única do formato — antes cada lista tinha o seu próprio formatador, e
 * saíam `05 de jul.`, `05 de jul. de 2026` e `05/07/2026` na mesma tela.
 *
 * Caixa alta e curta porque é o idioma que a Início já usa nos rótulos de KPI
 * (`REGISTROS ESTE MÊS`, `AVANÇO NO CICLO`); e porque monoespaçado favorece maiúsculas
 * e dígitos — `05 de jul.` em mono lê como código, `05 JUL` lê como medida.
 *
 * Normaliza data-only para meia-noite local: `new Date("2026-07-05")` é UTC e
 * volta um dia em BRT.
 */
export function formatListDate(value: string | null | undefined) {
  if (!value) return null
  const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  const date = new Date(dateOnly ? `${dateOnly}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return null
  return `${String(date.getDate()).padStart(2, "0")} ${LIST_DATE_MONTHS[date.getMonth()]}`
}

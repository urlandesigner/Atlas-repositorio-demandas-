import { cn } from "@/lib/utils"

/**
 * Medidor de prontidão em barras discretas — leitura de instrumento, não barra
 * de progresso lisa. Cada barra acesa representa uma fatia da prontidão, de
 * modo que registrar evidência acende um segmento visível.
 */
export function TrilhaGauge({
  value,
  segments = 12,
  className,
  hideFromScreenReader = false,
}: {
  value: number
  segments?: number
  className?: string
  /**
   * Quando o percentual já está visível como texto ao lado do medidor (caso da
   * variante `hero` da Trilha), esconde o medidor do leitor de tela para não
   * anunciar o mesmo número duas vezes.
   */
  hideFromScreenReader?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const lit = Math.round((clamped / 100) * segments)

  return (
    <div
      {...(hideFromScreenReader
        ? { "aria-hidden": true }
        : {
            role: "progressbar" as const,
            "aria-valuemin": 0,
            "aria-valuemax": 100,
            "aria-valuenow": Math.round(clamped),
            "aria-label": "Prontidão para o próximo nível",
          })}
      className={cn("flex items-end gap-[3px]", className)}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < lit
        // Altura crescente: o medidor sobe da esquerda para a direita.
        const height = 42 + Math.round((i / Math.max(1, segments - 1)) * 58)
        return (
          <span
            key={i}
            className={cn(
              "w-full rounded-[1px] transition-colors",
              on ? "bg-gauge-on" : "bg-border"
            )}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/* Campo tem fundo de SUPERFICIE, nao de preenchimento.
 *
 * Estava `bg-muted`, e o cinza era meu: quando a borda dos campos clareou para
 * o cinza do badge, eu adicionei o preenchimento por conta propria como
 * compensacao de contraste. Nao foi o que se pediu, e o efeito foi um campo
 * cinza dentro de um cartao branco, que le como bloco desabilitado.
 *
 * `bg-card` e nao `bg-white`: branco no claro, superficie do cartao no escuro.
 *
 * A consequencia fica dita: sem o preenchimento, a unica coisa que separa o
 * campo do cartao e a borda `--input`, que mede 1,58:1 no claro — abaixo dos
 * 3:1 que a WCAG 1.4.11 pede para fronteira de componente. Foi decisao do
 * usuario, tomada duas vezes; o gate de contraste ja carrega essa inversao
 * documentada em scripts/check-contrast.mjs.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[min(var(--radius-md),8px)] border border-input bg-card px-4 py-3 text-base text-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }

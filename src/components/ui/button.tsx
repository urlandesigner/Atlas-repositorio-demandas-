import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * ## Que `size` usar
 *
 * Três contextos, três tamanhos — medidos no app, não inventados:
 *
 * | contexto | size | por quê |
 * |---|---|---|
 * | CTA de cabeçalho | `sm` | 36px é a malha do app: mesma altura da faixa do header dos cards e das linhas da navegação lateral. O contrato está em `PageHeaderActions`. |
 * | ação em linha de lista | `sm` | compacta, para não competir com o conteúdo da linha. 18 de 20 já eram assim. |
 * | rodapé de Sheet/Dialog | `default` | é a ação que confirma o trabalho do painel; 33 de 35 já eram assim. |
 *
 * `xs` é para densidade excepcional (CTA dentro de uma linha de aviso), `lg`
 * não tem consumidor fora da vitrine.
 *
 * Isso está escrito porque a altura já divergiu uma vez: dos 11 CTAs de
 * cabeçalho, 6 estavam em `default` e 5 em `sm` — decidido em cada chamada.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border bg-clip-padding font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-primary-hover hover:border-primary-hover",
        outline:
          "border-transparent bg-muted text-foreground hover:bg-muted-hover aria-expanded:bg-muted-hover",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary-hover hover:border-secondary-hover aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "border-destructive/30 bg-destructive/15 text-danger-foreground hover:bg-destructive/25 focus-visible:border-destructive/50 focus-visible:ring-destructive/20",
        link: "text-accent-ink underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-[18px] text-sm leading-none tracking-[0em] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-2 text-[12px] leading-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-sm leading-none has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-5 text-sm leading-none has-data-[icon=inline-end]:pr-[18px] has-data-[icon=inline-start]:pl-[18px]",
        icon: "size-8",
        "icon-xs":
          "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

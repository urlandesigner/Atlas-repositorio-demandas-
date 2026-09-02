"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"

import { cn } from "@/lib/utils"

/**
 * Tamanhos fora da string base de propósito.
 *
 * Quando viviam como `data-[size=lg]:size-10` dentro dela, o seletor de atributo
 * vencia qualquer `size-*` vindo de className — e o tailwind-merge não deduplica
 * os dois, porque os prefixos de variante são diferentes. O resultado era
 * silencioso: cinco telas pediam avatar maior e todas renderizavam 40px.
 *
 * Como uma classe simples, o tailwind-merge resolve o conflito corretamente e
 * className volta a ter a última palavra. O `data-size` continua no elemento
 * porque os descendentes (fallback, badge, group count) dependem dele.
 */
/**
 * A escala tem seis degraus porque o avatar se relaciona com o NOME ao lado
 * dele, e os nomes do app têm tamanhos diferentes. Com cinco degraus, o `xl`
 * servia dois contextos incompatíveis ao mesmo tempo: 56px ao lado de um nome
 * de 20px no cartão de identidade (razão 2,8:1, pesado — o avatar vencia até o
 * título de 32px da página) e 56px ao lado de um nome de 32px na ficha do
 * liderado (1,75:1, correto). Um valor não podia estar certo nos dois.
 */
const AVATAR_SIZE = {
  sm: "size-6", // 24 — linha de lista, chip, grupo empilhado
  default: "size-8", // 32
  lg: "size-10", // 40 — cartão de usuário na sidebar
  xl: "size-12", // 48 — cartão de identidade, cartão do diretório (nome 15–20px)
  "2xl": "size-14", // 56 — ficha do liderado (nome 32px)
  "3xl": "size-20", // 80 — herói do perfil público, sobreposto à capa
} as const

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: keyof typeof AVATAR_SIZE
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
        AVATAR_SIZE[size],
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground",
        "group-data-[size=sm]/avatar:text-xs group-data-[size=xl]/avatar:text-base group-data-[size=2xl]/avatar:text-base group-data-[size=3xl]/avatar:text-xl",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        "group-data-[size=xl]/avatar:size-3.5 group-data-[size=xl]/avatar:[&>svg]:size-2.5",
        "group-data-[size=2xl]/avatar:size-3.5 group-data-[size=2xl]/avatar:[&>svg]:size-2.5",
        "group-data-[size=3xl]/avatar:size-4 group-data-[size=3xl]/avatar:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=xl]/avatar-group:size-12 group-has-data-[size=2xl]/avatar-group:size-14 group-has-data-[size=3xl]/avatar-group:size-20 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}

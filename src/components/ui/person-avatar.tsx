"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initialsFromName } from "@/lib/profile/store"
import { cn } from "@/lib/utils"

export function PersonAvatar({
  name,
  imageUrl,
  size = "default",
  className,
}: {
  name: string
  imageUrl?: string | null
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  return (
    <Avatar size={size} className={cn("bg-brand-muted/70", className)}>
      {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
      <AvatarFallback className="bg-brand-muted text-brand-muted-foreground">
        {initialsFromName(name)}
      </AvatarFallback>
    </Avatar>
  )
}

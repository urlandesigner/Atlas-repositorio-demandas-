"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Escuro é o padrão do Atlas; claro é opcional. `next-themes` injeta o script
 * inline que evita o flash de tema errado na primeira pintura do SSR.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      themes={["dark", "light"]}
    >
      {children}
    </NextThemesProvider>
  )
}

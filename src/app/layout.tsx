import type { Metadata } from "next"
import Script from "next/script"
import { Archivo, JetBrains_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Atlas",
  description: "Registros profissionais, evidências de impacto e desenvolvimento de carreira.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${jetBrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        {/* Widget de avaliação de experiência (projeto Ybera Feedback). Só renderiza se
            NEXT_PUBLIC_FEEDBACK_URL estiver definida — sem a variável, o Atlas roda como
            antes. Modo "manual": o widget NÃO desenha botão flutuante; quem convida é o
            item no rodapé do sidebar (ver components/shell/feedback-invite.tsx). A
            aparência do card vem da tela /admin do Feedbacks. */}
        {process.env.NEXT_PUBLIC_FEEDBACK_URL && (
          <Script
            src={`${process.env.NEXT_PUBLIC_FEEDBACK_URL}/yfb.js`}
            strategy="afterInteractive"
            data-product="atlas-profissional"
            data-mode="manual"
          />
        )}
      </body>
    </html>
  )
}

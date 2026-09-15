"use client"

import { useEffect, useState } from "react"
import { MessageSquareHeart } from "lucide-react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

/**
 * Convite para avaliar a experiência, no rodapé do sidebar.
 *
 * O gatilho é desenhado AQUI, e não pelo widget, de propósito: o widget roda em Shadow DOM
 * (isolado do nosso CSS), então um botão entregue por ele não herdaria o tema, o estado
 * colapsado nem o comportamento de foco do sidebar. O widget entrega apenas o card.
 *
 * Quem decide se o item aparece é o Feedbacks: `canAsk()` responde false para quem já
 * avaliou e ainda está no prazo de silêncio (default 90 dias, configurável por produto).
 */
export function FeedbackInvite() {
  // null = ainda não sabemos. Começa escondido para o item não piscar na tela de quem
  // já avaliou (a resposta depende de uma chamada de rede do widget).
  const [podeAvaliar, setPodeAvaliar] = useState<boolean | null>(null)

  useEffect(() => {
    let ativo = true

    // O yfb.js entra com strategy="afterInteractive": pode não estar pronto no primeiro
    // render. Tenta por ~5s e desiste — sem widget, o item simplesmente não aparece.
    let tentativas = 0
    const timer = setInterval(() => {
      const api = window.YberaFeedback
      if (!api) {
        if (++tentativas > 50) clearInterval(timer)
        return
      }
      clearInterval(timer)
      void api
        .canAsk()
        .then((pode) => { if (ativo) setPodeAvaliar(pode) })
        .catch(() => { if (ativo) setPodeAvaliar(false) })
    }, 100)

    return () => { ativo = false; clearInterval(timer) }
  }, [])

  async function abrir() {
    const avaliou = await window.YberaFeedback?.open()
    // Avaliou: o item sai da tela na hora, sem esperar reload. O silêncio de N dias é
    // guardado pelo próprio widget.
    if (avaliou) setPodeAvaliar(false)
  }

  if (podeAvaliar !== true) return null

  return (
    // O respiro lateral mora aqui, e nao num wrapper no sidebar: se ficasse fora, o
    // wrapper sobreviveria ao `return null` acima como filho de altura zero e ainda
    // consumiria o `gap-4` do SidebarFooter - 16px de folga fantasma acima do card do
    // usuario, justamente no caso comum (quem ja avaliou, ou o widget fora do ar).
    // px-3 e o mesmo do SidebarGroup, entao o item alinha com os de navegacao.
    <SidebarMenu className="px-3">
      <SidebarMenuItem>
        {/* tooltip cobre o sidebar colapsado (só ícone), igual aos itens de navegação */}
        <SidebarMenuButton onClick={() => void abrir()} tooltip="Avaliar experiência">
          <MessageSquareHeart />
          <span>Avaliar experiência</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

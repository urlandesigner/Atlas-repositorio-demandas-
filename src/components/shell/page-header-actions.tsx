import { NotificationsPopover } from "@/components/ui/notifications-popover"

/**
 * Cluster de ações do topo da página, sempre alinhado à direita.
 * Inclui o sino de notificações como último item (desktop) — em páginas
 * sem CTA primário, o sino flutuante do shell cobre o mesmo lugar.
 *
 * ## Tamanho do CTA: `size="sm"`
 *
 * O CTA de cabeçalho é sempre `sm` (36px). Não é preferência: 36px é a mesma
 * altura da faixa `min-h-9` do header dos cards e das linhas da navegação
 * lateral no desktop, então os três se alinham na mesma malha.
 *
 * Isso precisou virar regra escrita porque a altura estava sendo decidida em
 * cada chamada: numa varredura, dos 11 CTAs de cabeçalho do app, 6 estavam em
 * `default` (40px) e 5 em `sm` (36px) — cara ou coroa. Na prática, "Nova
 * trilha" no PDI tinha 40px e "Novo colaborador" em Meu time tinha 36px.
 *
 * A regra `[&>button]:h-9 [&>a]:h-9` abaixo é rede de segurança, não o
 * mecanismo: quem esquecer o `size` ainda cai na altura certa. O contrato
 * continua sendo passar `size="sm"`, porque só ele acerta também o padding
 * horizontal e o raio.
 */
export function PageHeaderActions({ children }: { children?: React.ReactNode }) {
  return (
    <div
      data-page-actions
      className="flex shrink-0 flex-wrap items-center gap-2 [&>a]:h-9 [&>button]:h-9"
    >
      {children}
      <div className="hidden md:block">
        <NotificationsPopover />
      </div>
    </div>
  )
}

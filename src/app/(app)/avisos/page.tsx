"use client"

import { HrNoticesPanel } from "@/components/hr/hr-notices-panel"
import { PageHeader } from "@/components/ui/page-header"

/**
 * Lista completa dos avisos do RH — o destino do "Ver todos" da Início.
 *
 * Até aqui os avisos só existiam recortados no dashboard (três) e na tela de
 * gestão do admin, que o colaborador não acessa. Não havia lugar nenhum onde
 * ele pudesse ler o quarto aviso em diante.
 *
 * Fora da navegação lateral de propósito: é uma extensão da Início, alcançada a
 * partir dela, e não uma área do produto.
 */
export default function AvisosRhPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Avisos do RH"
        description="Comunicados importantes para orientar prazos, benefícios e rituais do ciclo."
      />
      <HrNoticesPanel showAll hideHeader />
    </div>
  )
}

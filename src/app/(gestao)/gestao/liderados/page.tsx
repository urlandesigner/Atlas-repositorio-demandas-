import { CollaboratorsManager } from "@/components/gestao/collaborators-manager"
import { LideradosMatrix } from "@/components/gestao/liderados-matrix"

export default function GestaoLideradosPage() {
  return (
    <div className="flex flex-col gap-8">
      <LideradosMatrix />
      <CollaboratorsManager
        title="Meu time"
        description="Pessoas que respondem diretamente a você, com acesso rápido ao perfil comportamental, PDI e acompanhamento do ciclo."
      />
    </div>
  )
}

import { CollaboratorsManager } from "@/components/gestao/collaborators-manager"
import { LideradosMatrix } from "@/components/gestao/liderados-matrix"

export default function GestaoLideradosPage() {
  return (
    <div className="flex flex-col gap-8">
      <LideradosMatrix />
      <CollaboratorsManager
        title="Meu time"
        description="Quem responde a você — ficha, PDI e ciclo em um clique."
      />
    </div>
  )
}

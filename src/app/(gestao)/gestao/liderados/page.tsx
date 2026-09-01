import { CollaboratorsManager } from "@/components/gestao/collaborators-manager"
import { LideradosMatrix } from "@/components/gestao/liderados-matrix"

export default function GestaoLideradosPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* O CollaboratorsManager é quem traz o PageHeader com o título e o
          "Novo colaborador". Ele estava depois da matriz, então a página abria
          com um mapa e o título aparecia no meio do scroll. O mapa é leitura
          analítica sobre o time; a lista é o trabalho. */}
      <CollaboratorsManager
        title="Meu time"
        description="Quem responde a você — ficha, PDI e ciclo em um clique."
      />
      <LideradosMatrix />
    </div>
  )
}

import { SoftSkillsTemplatePanel } from "@/components/gestao/soft-skills-template-panel"

export default function AdminSoftSkillsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Competências da área</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Template customizável de pilares para todos os gestores da área. Avaliações individuais
          continuam na ficha de cada liderado.
        </p>
      </div>
      <SoftSkillsTemplatePanel />
    </div>
  )
}

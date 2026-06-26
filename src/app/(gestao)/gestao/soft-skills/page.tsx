import { SoftSkillsTemplatePanel } from "@/components/gestao/soft-skills-template-panel"

export default function GestaoSoftSkillsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Competências</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina os pilares padrão da área. Na ficha de cada liderado você ainda pode personalizar
          pilares e notas individualmente.
        </p>
      </div>
      <SoftSkillsTemplatePanel />
    </div>
  )
}

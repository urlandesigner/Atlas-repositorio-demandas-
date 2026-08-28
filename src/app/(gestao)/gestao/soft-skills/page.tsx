import { SoftSkillsTemplatePanel } from "@/components/gestao/soft-skills-template-panel"
import { PageHeader } from "@/components/ui/page-header"

export default function GestaoSoftSkillsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Competências"
        description="Defina os pilares padrão da área. Na ficha de cada liderado você ainda pode personalizar pilares e notas individualmente."
      />
      <SoftSkillsTemplatePanel />
    </div>
  )
}

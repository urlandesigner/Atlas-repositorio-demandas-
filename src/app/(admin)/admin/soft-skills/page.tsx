import { SoftSkillsTemplatePanel } from "@/components/gestao/soft-skills-template-panel"
import { PageHeader } from "@/components/ui/page-header"

export default function AdminSoftSkillsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Competências da área"
        description="Template customizável de pilares para todos os gestores da área. Avaliações individuais continuam na ficha de cada liderado."
      />
      <SoftSkillsTemplatePanel />
    </div>
  )
}

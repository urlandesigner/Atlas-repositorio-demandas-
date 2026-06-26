import { FrameworkEditor } from "@/components/gestao/framework-editor"

export default async function FrameworkEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <FrameworkEditor key={id} frameworkId={id} />
}

import { KUDO_TYPE_META, type Kudo, type KudoType } from "@/lib/org/social"
import type { OrgArea, OrgUser } from "@/lib/org/types"

import type { RecognitionDraft, RecognitionEntry, RecognitionType } from "./types"

/**
 * Ponte entre a camada social e o dossiê de carreira.
 *
 * `Kudo` é um elogio par-a-par: casual, curto, escrito por um colega.
 * `RecognitionEntry` é evidência curada, que entra no relatório de promoção.
 * Um não vira o outro automaticamente — a conversão pré-preenche o formulário
 * e a pessoa revisa antes de salvar, porque a linguagem de um elogio de
 * corredor raramente é a linguagem de um dossiê.
 *
 * Fica em lib/ e não na página para que a mesma ação possa ser oferecida em
 * /people/<id> depois, sem duplicar a regra de mapeamento.
 */

/**
 * `KudoType` e `RecognitionType` são vocabulários independentes. Só "cultura"
 * não tem par: o dossiê não tem uma categoria cultural, e colaboração é a
 * leitura mais honesta de "fez o ambiente melhor".
 */
const KUDO_TO_RECOGNITION_TYPE: Record<KudoType, RecognitionType> = {
  impacto: "impacto",
  colaboracao: "colaboracao",
  inovacao: "inovacao",
  mentoria: "mentoria",
  cultura: "colaboracao",
}

export function buildRecognitionDraftFromKudo({
  kudo,
  from,
  areas,
}: {
  kudo: Kudo
  /** Quem enviou o elogio. Pode não existir mais no cadastro. */
  from: OrgUser | undefined
  areas: OrgArea[]
}): RecognitionDraft {
  const meta = KUDO_TYPE_META[kudo.type]
  const fromName = from?.name ?? "Alguém da rede"
  const area = from?.areaId ? areas.find((item) => item.id === from.areaId) : undefined

  return {
    // Título curto e obviamente editável: quem converte quase sempre quer
    // reescrever, e um título gerado da mensagem sairia truncado no meio.
    title: `${meta.label} — ${fromName}`,
    description: kudo.message,
    recognizedBy: fromName,
    recognizerArea: area?.name,
    date: kudo.createdAt.slice(0, 10),
    type: KUDO_TO_RECOGNITION_TYPE[kudo.type],
    linkedRecordIds: [],
    sourceKudoId: kudo.id,
  }
}

/** Elogios que ainda não viraram evidência — o que sobra para converter. */
export function filterKudosNotYetEvidence(
  kudos: Kudo[],
  recognitions: RecognitionEntry[]
): Kudo[] {
  const converted = new Set(
    recognitions
      .map((item) => item.sourceKudoId)
      .filter((id): id is string => Boolean(id))
  )
  return kudos.filter((kudo) => !converted.has(kudo.id))
}

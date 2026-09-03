/**
 * Ressincronização de dado de seed com o snapshot salvo no navegador.
 *
 * O problema que isto resolve: todos os stores deste app seguem o padrão
 * "semeia se a chave não existe, senão devolve o salvo por inteiro". Isso faz o
 * seed alcançar apenas navegador virgem — ou seja, correção em dado de seed
 * nunca chega em quem já abriu o app, que é justamente quem usa o produto.
 *
 * Aconteceu de verdade e mais de uma vez: um framework de PDI renomeado meses
 * antes continuava com o nome antigo; níveis corrigidos não apareciam; e o mural
 * de reconhecimentos ficava vazio porque os kudos do seed nunca chegavam.
 *
 * As regras, em ordem de prioridade:
 *
 * 1. O que a pessoa criou nunca é tocado — só ids que o seed conhece.
 * 2. Item de seed que a pessoa apagou continua apagado. É para isso que serve a
 *    lista de já-oferecidos: sem ela, cada leitura ressuscitaria o que foi
 *    removido de propósito.
 * 3. Item de seed que existe nos dois lados é reescrito a partir do seed. Este
 *    é o custo declarado: edição feita pelo app em registro do seed volta ao
 *    valor do seed quando a versão sobe.
 *
 * A versão é o gatilho. Enquanto ela não muda, nada é reescrito — então subir a
 * versão é uma decisão consciente, não um efeito de cada leitura.
 */

function lerJson<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? (JSON.parse(bruto) as T) : padrao
  } catch {
    return padrao
  }
}

/**
 * Diz se este navegador ainda não recebeu a versão atual do seed, e marca que
 * recebeu.
 *
 * Marca ANTES de o chamador aplicar a união de propósito: se a escrita do
 * snapshot falhar por falta de espaço, é melhor pular a ressincronização desta
 * vez do que repeti-la a cada leitura e sobrescrever em loop o que a pessoa
 * editou.
 */
export function precisaRessincronizar(chaveVersao: string, versao: string): boolean {
  let salva: string | null = null
  try {
    salva = localStorage.getItem(chaveVersao)
  } catch {
    return false
  }
  if (salva === versao) return false
  try {
    localStorage.setItem(chaveVersao, versao)
  } catch {
    return false
  }
  return true
}

/** Registra a versão sem ressincronizar — para quando o seed acabou de ser gravado inteiro. */
export function marcarVersao(chaveVersao: string, versao: string) {
  try {
    localStorage.setItem(chaveVersao, versao)
  } catch {
    // Sem marca, a próxima leitura ressincroniza sobre o próprio seed: inócuo.
  }
}

/**
 * Une uma lista salva com a lista do seed, por id.
 *
 * `chaveOferecidos` guarda os ids de seed que já passaram por este navegador,
 * para distinguir "nunca chegou aqui" de "chegou e foi apagado".
 */
export function unirPorId<T extends { id: string }>(
  salvos: T[],
  doSeed: T[],
  chaveOferecidos: string
): T[] {
  const jaOferecidos = new Set(lerJson<string[]>(chaveOferecidos, []))
  const porId = new Map(doSeed.map((item) => [item.id, item]))
  const idsSalvos = new Set(salvos.map((item) => item.id))

  const atualizados = salvos.map((item) => porId.get(item.id) ?? item)
  const novos = doSeed.filter((item) => !idsSalvos.has(item.id) && !jaOferecidos.has(item.id))

  if (novos.length) {
    try {
      localStorage.setItem(
        chaveOferecidos,
        JSON.stringify([...jaOferecidos, ...novos.map((item) => item.id)])
      )
    } catch {
      // Sem a lista, o pior caso é reoferecer um item apagado numa próxima
      // versão. Não vale derrubar a leitura por isso.
    }
  }

  return [...atualizados, ...novos]
}

/** Registra todos os ids de um seed como já oferecidos, na primeira semeadura. */
export function registrarOferecidos(ids: string[], chaveOferecidos: string) {
  try {
    localStorage.setItem(chaveOferecidos, JSON.stringify(ids))
  } catch {
    // Ver acima.
  }
}

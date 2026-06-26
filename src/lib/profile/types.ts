// Dados armazenados do perfil profissional. Tudo o que NÃO está aqui (impacto,
// competências, conquistas, insights) é derivado dos registros — ver derive.ts.

export interface LevelDef {
  id: string
  name: string
}

export interface ProfileIdentity {
  name: string
  role: string
  /** Aponta para um LevelDef.id da trilha. */
  levelId: string
  area: string
  squad: string
  leader: string
  /** Data de entrada na empresa (ISO). Usada para calcular tempo de empresa. */
  startDate: string
  headline: string | null
}

export interface CareerGoal {
  targetRole: string
  /** LevelDef.id desejado na trilha. */
  targetLevelId: string
  targetYear: number | null
  notes: string | null
}

export interface ProfileData {
  identity: ProfileIdentity
  goal: CareerGoal
  /** Trilha de níveis, ordenada do mais júnior ao mais sênior. */
  ladder: LevelDef[]
}

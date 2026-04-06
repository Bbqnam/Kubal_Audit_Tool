import type { AuditPlanningType } from './planning'

export type SpecializedAuditType = 'vda63' | 'vda65'

export type GenericAuditType =
  | 'template'
  | 'system'
  | 'process'
  | 'product'
  | 'supplier'
  | 'certification'
  | 'sustainability'
  | 'compliance'
  | 'follow-up'
  | 'special'
  | 'custom'

export type AuditType = SpecializedAuditType | GenericAuditType

export type AuditTypeFamily = AuditPlanningType

export type ScoreOption = 0 | 4 | 6 | 8 | 10

export type Vda63ChapterKey = 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7'

export type Vda63ChapterScope = 'inScope' | 'outOfScope'

export type Vda63ChapterStatus = 'outOfScope' | 'notEvaluated' | 'inProgress' | 'completed' | 'downgraded'

export type Vda63Classification = 'A' | 'B' | 'C'

export type Vda63ChapterResult = Vda63Classification | 'neutral'

export type Vda63QuestionGroup = string

export type Vda63ProductProcessType = 'Product' | 'Process'

export type Vda65ChecklistStatus = 'Pending' | 'OK' | 'NOK'

export type Vda65DefectClass = 'A' | 'B' | 'C'

export type Vda65ScoreBand = 'Very Good (OK)' | 'Good (OK)' | 'Satisfactory (OK)' | 'Not OK (Audit Failed)'

export type Vda65AuditDecision = 'Not started' | 'In progress' | 'OK' | 'Audit Failed'

export type ActionPlanStatus = 'Open' | 'In progress' | 'Closed'
export type NonconformityType = 'Major nonconformity' | 'Minor nonconformity' | 'Observation' | 'Improvement suggestion'

export type AuditLifecycleStatus = 'Not started' | 'In progress' | 'Completed'

export type AuditInfo = {
  site: string
  auditor: string
  date: string
  reference: string
  auditStatus: AuditLifecycleStatus
  department: string
  customer?: string
  scope: string
  notes: string
}

export type ProductInfo = {
  productName: string
  productNumber: string
  batch: string
  releaseDate: string
  productionLine: string
  customerPlant: string
  notes: string
}

export type Vda63QuestionBankItem = {
  id: string
  chapter: Vda63ChapterKey
  number: string
  text: string
  isStarQuestion: boolean
  group?: Vda63QuestionGroup
  subgroup?: string
  productProcessType?: Vda63ProductProcessType
  order: number
  sourceSheet?: string
  sourceRow?: number
  parentQuestionRow?: number
  sourceHidden?: boolean
}

export type Vda63QuestionResponse = {
  id: string
  score: ScoreOption | null
  comment: string
  finding: string
}

export type Vda63AuditQuestion = Vda63QuestionBankItem & Vda63QuestionResponse

export type Vda65ChecklistItem = {
  id: string
  number: string
  section: string
  requirement: string
  status: Vda65ChecklistStatus
  specialCharacteristic: string
  defectClass: Vda65DefectClass
  unit: string
  minTolerance: string
  nominalValue: string
  maxTolerance: string
  sampleSize: number | null
  defectCount: number
  photoReference: string
  comment: string
}

export type ActionPlanItem = {
  id: string
  auditType: AuditType
  reportItemId?: string | null
  savedAt?: string | null
  processArea?: string
  clause?: string
  nonconformityType?: NonconformityType
  section: string
  finding: string
  action: string
  containmentAction: string
  rootCauseAnalysis: string
  correctiveAction: string
  preventiveAction: string
  verificationOfEffectiveness: string
  closureEvidence: string
  owner: string
  dueDate: string
  status: ActionPlanStatus
  comment: string
}

export type ActionPlanUpdatePatch = Partial<Pick<
  ActionPlanItem,
  | 'processArea'
  | 'clause'
  | 'nonconformityType'
  | 'section'
  | 'finding'
  | 'action'
  | 'containmentAction'
  | 'rootCauseAnalysis'
  | 'correctiveAction'
  | 'preventiveAction'
  | 'verificationOfEffectiveness'
  | 'closureEvidence'
  | 'owner'
  | 'dueDate'
  | 'status'
  | 'comment'
>>

export type GenericAuditReportItem = {
  id: string
  nonconformityType: NonconformityType
  processArea: string
  clause: string
  title: string
  requirement: string
  evidence: string
  statement: string
  recommendation: string
  savedAt?: string | null
}

export type AppNavItem = {
  label: string
  to: string
}

export type Vda63ChapterSummary = {
  chapter: Vda63ChapterKey
  scope: Vda63ChapterScope
  totalScore: number
  maxScore: number
  percent: number | null
  questionCount: number
  scoredQuestionCount: number
  answeredQuestionCount: number
  completionPercent: number
  status: Vda63ChapterStatus
  result: Vda63ChapterResult
  downgradeTriggered: boolean
  starQuestionCount: number
}

export type Vda63ElementSummary = {
  label: string
  totalScore: number
  maxScore: number
  percent: number | null
  questionCount: number
  scoredQuestionCount: number
}

export type Vda63SummaryResult = {
  chapters: Vda63ChapterSummary[]
  overallPercent: number | null
  totalScore: number
  maxScore: number
  inScopeChapterCount: number
  auditedChapterCount: number
  completedChapterCount: number
  inProgressChapterCount: number
  notEvaluatedChapterCount: number
  downgradeTriggered: boolean
  finalGrade: Vda63Classification | null
  finalStatus: 'Not evaluated' | 'In progress' | 'A - quality capable' | 'B - conditionally quality capable' | 'C - not quality capable'
}

export type Vda65Results = {
  totalChecks: number
  reviewedCount: number
  nokCount: number
  okCount: number
  pendingCount: number
  totalDefects: number
  totalScore: number
  defectClassOverview: Record<Vda65DefectClass, number>
  resultBand: Vda65ScoreBand | null
  auditDecision: Vda65AuditDecision
}

export type ExportDescriptor = {
  filename: string
  format: 'excel' | 'pdf'
  generatedAt: string
  message: string
}

export type AuditSummaryPreview = {
  progressPercent: number
  scorePreview?: string
  resultPreview?: string
}

export type Vda63AuditData = {
  auditInfo: AuditInfo
  responses: Vda63QuestionResponse[]
  participants: string[]
  chapterScope: Vda63ChapterKey[]
}

export type Vda65AuditData = {
  auditInfo: AuditInfo
  productInfo: ProductInfo
  checklist: Vda65ChecklistItem[]
}

export type GenericAuditData = {
  auditInfo: AuditInfo
  reportSummary: string
  reportItems: GenericAuditReportItem[]
}

export type AuditRecordBase = {
  id: string
  legacyIds?: string[]
  auditType: AuditType
  standard: string
  planRecordId: string | null
  title: string
  site: string
  auditor: string
  auditDate: string
  status: AuditLifecycleStatus
  createdAt: string
  updatedAt: string
  summary: AuditSummaryPreview
  actions: ActionPlanItem[]
}

export type Vda63AuditRecord = AuditRecordBase & {
  auditType: 'vda63'
  data: Vda63AuditData
}

export type Vda65AuditRecord = AuditRecordBase & {
  auditType: 'vda65'
  data: Vda65AuditData
}

export type GenericAuditRecord = AuditRecordBase & {
  auditType: GenericAuditType
  data: GenericAuditData
}

export type AuditRecord = Vda63AuditRecord | Vda65AuditRecord | GenericAuditRecord

export type SaveState = 'Idle' | 'Saving' | 'Saved'

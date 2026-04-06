import { actionPlanItems } from '../../../data/actionPlan'
import { vda63AuditInfo, vda63Participants, vda63SeedResponses } from '../../../data/vda63'
import { vda65AuditInfo, vda65Checklist, vda65ChecklistTemplate, vda65ProductInfo } from '../../../data/vda65'
import { getAuditStandardLabel } from '../../../data/auditTypes'
import { vda63QuestionBank } from '../../vda63/data/questionBank'
import { chapterOrder } from '../../../utils/auditUtils'
import type {
  ActionPlanItem,
  AuditInfo,
  AuditRecord,
  AuditType,
  GenericAuditReportItem,
  GenericAuditRecord,
  NonconformityType,
  ProductInfo,
  Vda63AuditRecord,
  Vda63QuestionResponse,
  Vda65AuditRecord,
  Vda65ChecklistItem,
} from '../../../types/audit'
import { summarizeAuditRecord, getAuditTypeLabel } from './auditSummary'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `audit-${Math.random().toString(36).slice(2, 10)}`
}

function createTimestamp() {
  return new Date().toISOString()
}

function createTitle(auditType: AuditType, site?: string) {
  return `${getAuditTypeLabel(auditType)}${site ? ` - ${site}` : ''}`
}

function hasDefaultAuditTitle(record: AuditRecord) {
  return record.title.trim() === '' || record.title === createTitle(record.auditType) || record.title === getAuditTypeLabel(record.auditType)
}

function createBlankAuditInfo(base?: Partial<AuditInfo>): AuditInfo {
  return {
    ...clone(base ?? {}),
    site: '',
    auditor: '',
    date: createTimestamp().slice(0, 10),
    reference: '',
    auditStatus: 'Not started',
    department: '',
    scope: '',
    notes: '',
  }
}

function createBlankGenericReportItem(base?: Partial<GenericAuditReportItem>): GenericAuditReportItem {
  const clonedBase = clone(base ?? {})

  return {
    nonconformityType: 'Minor nonconformity',
    processArea: '',
    clause: '',
    title: '',
    requirement: '',
    evidence: '',
    statement: '',
    recommendation: '',
    ...clonedBase,
    id: clonedBase.id ?? createId(),
  }
}

function createBlankActionPlanItem(auditType: AuditType, base?: Partial<ActionPlanItem>): ActionPlanItem {
  const clonedBase = clone(base ?? {})

  return {
    processArea: '',
    clause: '',
    nonconformityType: 'Minor nonconformity' as NonconformityType,
    section: '',
    finding: '',
    action: '',
    owner: '',
    dueDate: '',
    status: 'Open',
    comment: '',
    ...clonedBase,
    id: clonedBase.id ?? createId(),
    auditType,
  }
}

function normalizeGenericReportItems(items: GenericAuditReportItem[] | undefined) {
  return (items ?? []).map((item) => createBlankGenericReportItem(item))
}

function normalizeActionPlanItems(items: ActionPlanItem[] | undefined, auditType: AuditType) {
  return (items ?? []).map((item) => createBlankActionPlanItem(auditType, item))
}

function createBlankVda63Responses() {
  return clone(vda63QuestionBank).map<Vda63QuestionResponse>((question) => ({
    id: question.id,
    score: null,
    comment: '',
    finding: '',
  }))
}

function createBlankVda65Checklist() {
  return clone(vda65Checklist).map<Vda65ChecklistItem>((item) => ({
    ...item,
    status: 'Pending',
    defectCount: 0,
    comment: '',
  }))
}

function normalizeLegacyVda65ChecklistItem(item: Partial<Vda65ChecklistItem> & { id: string }) {
  return {
    id: item.id,
    number: item.number ?? '',
    section: item.section ?? 'Legacy',
    requirement: item.requirement ?? '',
    status: item.status ?? 'Pending',
    specialCharacteristic: item.specialCharacteristic ?? '',
    defectClass: item.defectClass ?? 'C',
    unit: item.unit ?? '',
    minTolerance: item.minTolerance ?? '',
    nominalValue: item.nominalValue ?? '',
    maxTolerance: item.maxTolerance ?? '',
    sampleSize: item.sampleSize ?? null,
    defectCount: item.defectCount ?? (item.status === 'NOK' ? 1 : 0),
    photoReference: item.photoReference ?? '',
    comment: item.comment ?? '',
  } satisfies Vda65ChecklistItem
}

function normalizeVda65Checklist(items: Vda65ChecklistItem[] | undefined) {
  const storedItems = items ?? []
  const templateById = new Map(vda65ChecklistTemplate.map((item) => [item.id, item]))
  const hasTemplateItems = storedItems.some((item) => templateById.has(item.id))

  if (!storedItems.length || hasTemplateItems) {
    const storedById = new Map(storedItems.map((item) => [item.id, item]))

    return vda65ChecklistTemplate.map((templateItem) => {
      const storedItem = storedById.get(templateItem.id)

      return {
        ...clone(templateItem),
        status: storedItem?.status ?? 'Pending',
        defectCount: storedItem?.defectCount ?? (storedItem?.status === 'NOK' ? 1 : 0),
        comment: storedItem?.comment ?? '',
      }
    })
  }

  return storedItems.map((item) => normalizeLegacyVda65ChecklistItem(item))
}

function createBlankProductInfo(base: ProductInfo): ProductInfo {
  return {
    ...clone(base),
    batch: '',
    notes: '',
  }
}

function withActionIds(items: ActionPlanItem[]) {
  return items.map((item) => ({
    ...createBlankActionPlanItem(item.auditType, item),
    id: createId(),
  }))
}

function withReportItemIds(items: GenericAuditReportItem[]) {
  return items.map((item) => ({
    ...createBlankGenericReportItem(item),
    id: createId(),
  }))
}

export function normalizeAuditRecordShape(record: AuditRecord): AuditRecord {
  const standard = record.standard ?? getAuditStandardLabel(record.auditType)

  if (record.auditType === 'vda65') {
    return {
      ...record,
      standard,
      planRecordId: record.planRecordId ?? null,
      data: {
        auditInfo: {
          ...createBlankAuditInfo(vda65AuditInfo),
          ...record.data.auditInfo,
        },
        productInfo: {
          ...createBlankProductInfo(vda65ProductInfo),
          ...record.data.productInfo,
        },
        checklist: normalizeVda65Checklist(record.data.checklist),
      },
    }
  }

  if (record.auditType !== 'vda63') {
    return {
      ...record,
      standard,
      planRecordId: record.planRecordId ?? null,
      actions: normalizeActionPlanItems(record.actions, record.auditType),
      data: {
        auditInfo: {
          ...createBlankAuditInfo(),
          ...record.data.auditInfo,
        },
        reportSummary: (record.data as Partial<GenericAuditRecord['data']>).reportSummary ?? '',
        reportItems: normalizeGenericReportItems((record.data as Partial<GenericAuditRecord['data']>).reportItems),
      },
    }
  }

  const legacyQuestions = (record.data as { questions?: Array<{ id: string; score: Vda63QuestionResponse['score']; comment: string; finding: string }> }).questions
  const validQuestionIds = new Set(vda63QuestionBank.map((question) => question.id))
  const existingResponses = record.data.responses ?? legacyQuestions?.map((question) => ({
    id: question.id,
    score: question.score,
    comment: question.comment,
    finding: question.finding,
  }))
  const normalizedResponses = existingResponses?.filter((response) => validQuestionIds.has(response.id))
  const hasCompleteResponseSet = normalizedResponses?.length === vda63QuestionBank.length
  const hasStoredChapterScope = Array.isArray(record.data.chapterScope)
  const normalizedChapterScope = record.data.chapterScope?.filter((chapter) => chapterOrder.includes(chapter))

  return {
    ...record,
    standard,
    planRecordId: record.planRecordId ?? null,
    data: {
      auditInfo: record.data.auditInfo,
      responses:
        hasCompleteResponseSet && normalizedResponses
          ? createBlankVda63Responses().map((response) => normalizedResponses.find((item) => item.id === response.id) ?? response)
          : createBlankVda63Responses(),
      participants: record.data.participants ?? clone(vda63Participants),
      chapterScope: hasStoredChapterScope ? clone(normalizedChapterScope ?? []) : clone(chapterOrder),
    },
  }
}

export function createAuditRecord(auditType: AuditType): AuditRecord {
  const now = createTimestamp()

  const record: AuditRecord =
    auditType === 'vda63'
      ? {
          id: createId(),
          auditType,
          standard: 'VDA 6.3',
          planRecordId: null,
          title: createTitle(auditType),
          site: '',
          auditor: '',
          auditDate: now.slice(0, 10),
          status: 'Not started',
          createdAt: now,
          updatedAt: now,
          summary: { progressPercent: 0 },
          actions: [],
          data: {
            auditInfo: createBlankAuditInfo(vda63AuditInfo),
            responses: createBlankVda63Responses(),
            participants: clone(vda63Participants),
            chapterScope: clone(chapterOrder),
          },
        }
      : auditType === 'vda65'
        ? {
            id: createId(),
            auditType,
            standard: 'VDA 6.5',
            planRecordId: null,
            title: createTitle(auditType),
            site: '',
            auditor: '',
            auditDate: now.slice(0, 10),
            status: 'Not started',
            createdAt: now,
            updatedAt: now,
            summary: { progressPercent: 0 },
            actions: [],
            data: {
              auditInfo: createBlankAuditInfo(vda65AuditInfo),
              productInfo: createBlankProductInfo(vda65ProductInfo),
              checklist: createBlankVda65Checklist(),
            },
          }
      : {
          id: createId(),
          auditType,
          standard: getAuditStandardLabel(auditType),
          planRecordId: null,
          title: createTitle(auditType),
          site: '',
          auditor: '',
          auditDate: now.slice(0, 10),
          status: 'Not started',
          createdAt: now,
          updatedAt: now,
          summary: { progressPercent: 0 },
          actions: [],
          data: {
            auditInfo: createBlankAuditInfo(),
            reportSummary: '',
            reportItems: [],
          },
        }

  return synchronizeAuditRecord(record)
}

export function createSeedAuditRecords(): AuditRecord[] {
  const now = createTimestamp()

  const seedRecords: AuditRecord[] = [
    {
      id: createId(),
      auditType: 'vda63',
      standard: 'VDA 6.3',
      planRecordId: null,
      title: 'North Alliance Process Readiness Audit',
      site: vda63AuditInfo.site,
      auditor: vda63AuditInfo.auditor,
      auditDate: vda63AuditInfo.date,
      status: vda63AuditInfo.auditStatus,
      createdAt: now,
      updatedAt: now,
      summary: { progressPercent: 0 },
      actions: withActionIds(actionPlanItems.filter((item) => item.auditType === 'vda63')),
      data: {
        auditInfo: clone(vda63AuditInfo),
        responses: clone(vda63SeedResponses),
        participants: clone(vda63Participants),
        chapterScope: clone(chapterOrder),
      },
    },
    {
      id: createId(),
      auditType: 'vda65',
      standard: 'VDA 6.5',
      planRecordId: null,
      title: 'Sensor Control Module Product Audit',
      site: vda65AuditInfo.site,
      auditor: vda65AuditInfo.auditor,
      auditDate: vda65AuditInfo.date,
      status: vda65AuditInfo.auditStatus,
      createdAt: now,
      updatedAt: now,
      summary: { progressPercent: 0 },
      actions: withActionIds(actionPlanItems.filter((item) => item.auditType === 'vda65')),
      data: {
        auditInfo: clone(vda65AuditInfo),
        productInfo: clone(vda65ProductInfo),
        checklist: clone(vda65Checklist),
      },
    },
  ]

  return seedRecords.map((record) => synchronizeAuditRecord(normalizeAuditRecordShape(record), record.updatedAt))
}

export function duplicateAuditRecord(record: AuditRecord): AuditRecord {
  const now = createTimestamp()
  const duplicatedRecord: AuditRecord =
    record.auditType === 'vda63'
      ? ({
          ...clone(record),
          id: createId(),
          planRecordId: null,
          title: `${record.title} Copy`,
          createdAt: now,
          updatedAt: now,
          actions: withActionIds(record.actions),
          data: {
            auditInfo: clone(record.data.auditInfo),
            responses: clone(record.data.responses),
            participants: clone(record.data.participants),
            chapterScope: clone(record.data.chapterScope),
          },
        } satisfies Vda63AuditRecord)
      : record.auditType === 'vda65'
        ? ({
          ...clone(record),
          id: createId(),
          planRecordId: null,
          title: `${record.title} Copy`,
          createdAt: now,
          updatedAt: now,
          actions: withActionIds(record.actions),
          data: {
            auditInfo: clone(record.data.auditInfo),
            productInfo: clone(record.data.productInfo),
            checklist: clone(record.data.checklist),
          },
        } satisfies Vda65AuditRecord)
        : ({
            ...clone(record),
            id: createId(),
            planRecordId: null,
            title: `${record.title} Copy`,
            createdAt: now,
            updatedAt: now,
            actions: withActionIds(record.actions),
            data: {
              auditInfo: clone(record.data.auditInfo),
              reportSummary: record.data.reportSummary ?? '',
              reportItems: withReportItemIds(record.data.reportItems ?? []),
            },
          } satisfies GenericAuditRecord)

  return synchronizeAuditRecord(normalizeAuditRecordShape(duplicatedRecord))
}

export function changeAuditRecordType(record: AuditRecord, targetType: AuditType): AuditRecord {
  if (record.auditType === targetType) {
    return synchronizeAuditRecord(normalizeAuditRecordShape(record))
  }

  const sharedAuditInfo = record.data.auditInfo
  const resolvedTitle = hasDefaultAuditTitle(record) ? createTitle(targetType, sharedAuditInfo.site || record.site) : record.title
  const sharedActions = record.actions.map((item) => ({
    ...clone(item),
    auditType: targetType,
  }))

  const convertedRecord: AuditRecord = (() => {
    if (targetType === 'vda63') {
      const baseRecord = createAuditRecord('vda63') as Vda63AuditRecord

      return {
        ...baseRecord,
        id: record.id,
        planRecordId: record.planRecordId ?? null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        title: resolvedTitle,
        standard: 'VDA 6.3',
        actions: sharedActions,
        data: {
          ...baseRecord.data,
          auditInfo: {
            ...baseRecord.data.auditInfo,
            ...sharedAuditInfo,
          },
        },
      } satisfies Vda63AuditRecord
    }

    if (targetType === 'vda65') {
      const baseRecord = createAuditRecord('vda65') as Vda65AuditRecord

      return {
        ...baseRecord,
        id: record.id,
        planRecordId: record.planRecordId ?? null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        title: resolvedTitle,
        standard: 'VDA 6.5',
        actions: sharedActions,
        data: {
          ...baseRecord.data,
          auditInfo: {
            ...baseRecord.data.auditInfo,
            ...sharedAuditInfo,
          },
        },
      } satisfies Vda65AuditRecord
    }

    const baseRecord = createAuditRecord(targetType) as GenericAuditRecord

    return {
      ...baseRecord,
      id: record.id,
      planRecordId: record.planRecordId ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      title: resolvedTitle,
      standard: targetType === 'template' ? record.standard : record.standard || getAuditStandardLabel(targetType),
      actions: sharedActions,
      data: {
        auditInfo: {
          ...sharedAuditInfo,
        },
        reportSummary: record.auditType === 'vda63' || record.auditType === 'vda65' ? '' : record.data.reportSummary,
        reportItems: record.auditType === 'vda63' || record.auditType === 'vda65' ? [] : normalizeGenericReportItems(record.data.reportItems),
      },
    } satisfies GenericAuditRecord
  })()

  return synchronizeAuditRecord(normalizeAuditRecordShape(convertedRecord))
}

export function synchronizeAuditRecord(record: AuditRecord, updatedAt = createTimestamp()): AuditRecord {
  const normalizedRecord = normalizeAuditRecordShape(record)
  const auditInfo = normalizedRecord.data.auditInfo

  return {
    ...normalizedRecord,
    standard: normalizedRecord.standard || getAuditStandardLabel(normalizedRecord.auditType),
    site: auditInfo.site,
    auditor: auditInfo.auditor,
    auditDate: auditInfo.date,
    status: auditInfo.auditStatus,
    updatedAt,
    summary: summarizeAuditRecord(normalizedRecord),
  }
}
